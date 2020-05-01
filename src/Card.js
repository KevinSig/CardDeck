import React, { useEffect, useState, useRef} from "react";
import "./Card.css";
function Card(props) {
  // transform: translate(10px, 20px) rotate(20deg)
  let angle = Math.random() * 90 - 45;
  let xPos = Math.random() * 40 - 20;
  let yPos = Math.random() * 40 - 20;
//   let _transform = `translate(${xPos}px, ${yPos}px) rotate(${angle}deg)`;
  
const [trans, setTrans]= useState(`translate(${xPos}px, ${yPos}px) rotate(${angle}deg)`)

  return (
    <img
      style={{ transform: trans}}
      className="Card"
      src={props.image}
      alt={props.name}
    />
  );
}

export default Card;
