import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { BADGES } from "./badgeConfig";

export default function BadgeDisplay({ userId }) {
  const [earnedIds, setEarnedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setEarnedIds(userDoc.data().badges || []);
      }
      setLoading(false);
    }
    loadBadges();
  }, [userId]);

  if (loading) return <p>Loading badges...</p>;

  return (
    <div style={styles.grid}>
      {BADGES.map((badge) => {
        const earned = earnedIds.includes(badge.id);
        return (
          <div
            key={badge.id}
            style={{
              ...styles.card,
              opacity: earned ? 1 : 0.4,
              filter: earned ? "none" : "grayscale(100%)",
            }}
            title={badge.description}
          >
            <div style={styles.icon}>{badge.icon}</div>
            <div style={styles.name}>{badge.name}</div>
            <div style={styles.desc}>{badge.description}</div>
            {!earned && <div style={styles.locked}>🔒 Locked</div>}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "16px",
    padding: "16px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center",
    background: "#fafafa",
  },
  icon: { fontSize: "32px" },
  name: { fontWeight: "bold", marginTop: "6px" },
  desc: { fontSize: "12px", color: "#666", marginTop: "4px" },
  locked: { fontSize: "11px", color: "#999", marginTop: "6px" },
};