import React, { useEffect, useState } from 'react';
import "./App.css";
import DistanceWarning from './component/DistanceWarning/DistanceWarning';
import Voice from './component/Voice/Voice';

const App = () => {
  const [distance, setDistance] = useState(null);
  const [command, setCommand] = useState('');
  const [wsToClient, setWsToClient] = useState(null);
  const [auto, setAuto] = useState(true);
  const [showVoice, setShowVoice] = useState(false);

  useEffect(() => {
    const newWebSocket = new WebSocket('ws://172.20.10.2:8080/toClient');

    newWebSocket.onopen = () => {
      console.log('Connected to WebSocket server for ESP32');
    };

    newWebSocket.onmessage = (event) => {
      const data = event.data;
      console.log('Received data from server for ESP32:', data);

      try {
        const jsonData = JSON.parse(data);
        if (jsonData.event === 'distance_update') {
          const receivedDistance = jsonData.distance;
          setDistance(receivedDistance);
          console.log('Distance received:', receivedDistance);
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    newWebSocket.onclose = () => {
      console.log('Disconnected from WebSocket server for ESP32');
    };

    setWsToClient(newWebSocket);

    return () => {
      newWebSocket.close();
    };
  }, [command]);

  const handleCommandStart = (newCommand) => {
    if (newCommand === 'stop') {
      setAuto(true);
    }
    if (wsToClient) {
      wsToClient.send(newCommand);
    }
    setCommand(newCommand);
  };

  const handleAuto = () => {
    setAuto(!auto);
    wsToClient && auto === true ? wsToClient.send('auto') : wsToClient.send('stop');
  };

  const handleTranscript = (transcriptText) => {
    transcriptText = transcriptText.toLowerCase();

    switch (transcriptText) {
      case "forward":
        wsToClient && wsToClient.send('forward');
        break;
      case "left":
        wsToClient && wsToClient.send('left');
        break;
      case "right":
        wsToClient && wsToClient.send('right');
        break;
      case "back":
        wsToClient && wsToClient.send('back');
        break;
      case "auto":
        wsToClient && wsToClient.send('auto');
        break;
      default:
        // Handle other cases or do nothing
        break;
    }
  };


  const toggleVoice = () => {
    setShowVoice(!showVoice);
  };

  return (
    <div className="container">
      {Number(distance) < 50 && distance !== null && Number(distance) !== 0 ? <DistanceWarning distance={distance} /> : null}

      {showVoice ? (
        <div className="button-top">
          <button className='stop' onClick={() => handleCommandStart('stop')}>
            Stop
          </button>
        </div>
      ) : (
        <React.Fragment>
          <div className="button-top">
            <button onClick={() => handleCommandStart('forward')}>
              Forward
            </button>
          </div>
          <div className="button-center">
            <button onClick={() => handleCommandStart('left')}>
              Left
            </button>
            <button className='stop' onClick={() => handleCommandStart('stop')}>
              Stop
            </button>
            <button onClick={() => handleCommandStart('right')}>
              Right
            </button>
          </div>
          <div className="button-bottom">
            <button onClick={() => handleCommandStart('back')}>
              Back
            </button>
          </div>

        </React.Fragment>
      )}
      <div className="bottom_left">
        {showVoice ?
          <button className='stop'
            onClick={() => handleCommandStart('stop')}
          >
            Stop
          </button>
          :
          <button
            onClick={() => handleAuto()}
          >
            {auto ? 'Auto' : 'On Auto'}
          </button>
        }
      </div>

      <div className="bottom_right">
        <button onClick={() => toggleVoice()}>Voice</button>
      </div>

      {showVoice && <Voice onTranscript={handleTranscript} />}

    </div>
  );
};

export default App;
