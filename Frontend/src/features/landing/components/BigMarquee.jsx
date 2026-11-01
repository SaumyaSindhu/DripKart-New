import React from "react";

// Edit these phrases freely
const phrases = [
  "New drops every Friday",
  "Curated Archive",
  "Effortless elegance",
];

const BigMarquee = () => {
  return (
    <div
      className="overflow-hidden py-8 border-y"
      style={{ borderColor: "#e4e2df" }}
    >
      <div className="flex w-max animate-marquee-slow">
        {[...Array(4)].map((_, copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {phrases.map((phrase) => (
              <React.Fragment key={phrase}>
                <span
                  className="px-10 text-5xl lg:text-7xl font-light italic whitespace-nowrap"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "#1b1c1a",
                  }}
                >
                  {phrase}
                </span>
                <span className="text-3xl" style={{ color: "#C9A96E" }}>
                  ✦
                </span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BigMarquee;
