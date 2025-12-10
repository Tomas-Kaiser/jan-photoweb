import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-base-200 py-4">
      <div className="bg-gradient-to-r py-10 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-4">
          Ready to capture your best moments?
        </h2>
        <p className="mb-6 text-lg">
          Whether it&apos;s portraits, events, or creative shoots — I&apos;m
          here to make it unforgettable.
        </p>
        <Link href="/contact">
          <button className="inline-flex items-center justify-center h-10 px-6 bg-gradient-to-br from-purple-700 to-indigo-900 transition-all duration-300 hover:from-pink-600 hover:to-purple-800 hover:shadow-md cursor-pointer rounded text-white text-lg font-medium">
            Book a Photoshoot
          </button>
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center space-x-2">
          <a
            href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-circle"
          >
            <FontAwesomeIcon icon={faFacebook} className="w-6 h-6 text-black" />
          </a>
          <a
            href="https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-circle"
          >
            <FontAwesomeIcon
              icon={faInstagram}
              className="w-6 h-6 text-black"
            />
          </a>
        </div>
        <div className="text-sm text-gray-600">
          © {year} Jan Hajek | created by Tomas Kaiser
        </div>
      </div>
    </footer>
  );
};

export default Footer;
