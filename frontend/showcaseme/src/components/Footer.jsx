import React from "react";
import "./Footer.css";
import { AiFillGithub, AiOutlineMail } from "react-icons/ai";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-row">

        {/* Links Row (left) */}
        <ul className="footer-links">
          <li><a href="/about">About</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="mailto:support@showcaseme.com">Contact</a></li>
        </ul>

        {/* Center Copyright */}
        <p className="footer-copy">
            © {new Date().getFullYear()} ShowcaseMe — Built for creators, developers, and dreamers.
        </p>

        {/* Social Right */}
        <div className="footer-social">
          <a href="mailto:support@showcaseme.com"><AiOutlineMail /></a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;