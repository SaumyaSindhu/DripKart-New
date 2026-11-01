import React from "react";

const messages = [
  "Free shipping on orders above ₹1999",
  "New drops every Friday",
  "Easy 7-day returns",
];

const AnnouncementBar = () => {
  return (
    <div
      className="overflow-hidden py-2.5"
      style={{ backgroundColor: "#1b1c1a" }}
    >
      <div className="flex w-max animate-marquee">
        {[...Array(6)].map((_, copy) => (
          <div key={copy} className="flex shrink-0">
            {messages.map((msg) => (
              <span
                key={msg}
                className="px-10 text-[10px] uppercase tracking-[0.25em] font-medium whitespace-nowrap"
                style={{ color: "#C9A96E", fontFamily: "'Inter', sans-serif" }}
              >
                {msg}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
