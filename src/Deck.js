import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Deck.css";
import Card from "./Card";
import useToggle from "./useToggle"

function Deck() {
  const API_BASE_URL = "https://deckofcardsapi.com/api/deck";

  const [deck, setDeck] = useState(null);
  const [drawn, setDrawn] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [greeting, setGreetingToggle] = useToggle(true)
  
  const fetchData = async () => {
    let deck = await axios.get(`${API_BASE_URL}/new/shuffle/?deck_count=1`);
    console.log(deck.data);
    setDeck(deck.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDeck = () => {
    fetchData();
    setDrawn([])
    setRemaining(null)
  };


  const getCard = async () => {
    //make a request using deck id
    let id = deck.deck_id;
    try {
      let cardURL = `${API_BASE_URL}/${id}/draw/`;
      let cardRes = await axios.get(cardURL);
      if (!cardRes.data.success) {
        throw new Error("no cards remaining");
      }
      console.log(cardRes.data);
      let card = cardRes.data.cards[0];
      setRemaining(cardRes.data.remaining);
      setDrawn([
        ...drawn,
        {
          id: card.code,
          image: card.image,
          name: `${card.value} of ${card.suit}`,
        },
      ]);
    } catch (err) {
      alert(err);
    }
  };

  const cards = drawn.map((c) => (
    <Card key={c.id} name={c.name} image={c.image} />
  ));

  return (
    <div className="Deck">
      <h1 className="Deck-title">◈ Card Dealer ◈</h1>
      <h2 className="Deck-title subtitle">◈ This is a fun experiment ◈</h2>

      {remaining === 0 ? (
        <button className="deck-btn" onClick={getDeck}>
          Get New Deck
        </button>
      ) : (
        <button className="deck-btn" onClick={getCard}>
          Get Card
        </button>
      )}
      <h3 style={{ color: "white" }}> {remaining} Cards Remaining</h3>
      <h4  onClick = {setGreetingToggle} style={{ color: "white" }}>{greeting ? "hello": "goodbye"}</h4>
      <div className="Deck-area">{cards}</div>
    </div>
  );
}

export default Deck;
