import React, { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./Voice.css";
import { useState } from "react";

const Voice = ({ onTranscript }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [check, setCheck] = useState("");

  useEffect(() => {
    if (transcript.trim() !== "") {
      setCheck(transcript);
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  const handleSpeech = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      setCheck("");
      SpeechRecognition.startListening();
      resetTranscript();
    }
  };

  return (
    <div className="voice-container">
      <p>{check}</p>
      <button className="voiceChat" onClick={handleSpeech}>
        {listening ? "Stop" : "Start"}
      </button>
    </div>
  );
};

export default Voice;
