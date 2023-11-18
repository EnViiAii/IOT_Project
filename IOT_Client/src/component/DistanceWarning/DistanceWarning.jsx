import React from "react";
import "./DistanceWarning.css";

const DistanceWarning = ({ distance }) => (
  <div className="warning">
    <div className="warning-text">
      <p>Warning!</p>
    </div>
    <p>Approaching collision</p>
    <p>{distance} cm</p>
  </div>
);

export default DistanceWarning;
