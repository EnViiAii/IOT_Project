import React, { useEffect, useState } from 'react';
import "./App.css";
import DistanceWarning from './component/DistanceWarning/DistanceWarning';

const App = () => {
  const [distance, setDistance] = useState(null);
  const [command, setCommand] = useState('');
  const [wsToClient, setWsToClient] = useState(null);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    // const newWebSocket = new WebSocket('ws://localhost:8080/toClient');
    const newWebSocket = new WebSocket('ws://192.168.1.111:8080/toClient');

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

  return (
    <div className="container">
      {Number(distance) < 50 && distance !== null && Number(distance) !== 0 ? <DistanceWarning distance={distance} /> : null}
      <div className="button-top">
        <button
          onClick={() => handleCommandStart('forward')}
        >
          Forward
        </button>

      </div>
      <div className="button-center">
        <button
          onClick={() => handleCommandStart('left')}
        >
          Left
        </button>

        <button className='stop'
          onClick={() => handleCommandStart('stop')}
        >
          Stop
        </button>
        <button
          onClick={() => handleCommandStart('right')}
        >
          Right
        </button>
      </div>
      <div className="button-bottom">
        <button
          onClick={() => handleCommandStart('back')}
        >
          Back
        </button>
      </div>
      <div className="bottom">
        <button
          onClick={() => handleAuto()}
        >
          {auto ? 'Auto' : 'On Auto'}
        </button>
      </div>
    </div>
  );
};

export default App;
