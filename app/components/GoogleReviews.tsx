"use client";
import React, { useEffect } from "react";

const GoogleReviews = () => {
  useEffect(() => {
    // Dynamically inject Elfsight script if not already present
    if (
      !document.querySelector(
        'script[src="https://elfsightcdn.com/platform.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div
        className="elfsight-app-ade3bbaf-2454-46f0-b1ad-107b4e0c243b"
        data-elfsight-app-lazy
      ></div>
    </div>
  );
};

export default GoogleReviews;
