// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-1 mt-auto">
      <div className="footer text-center">
        <p className="mb-0 small">
          Created by: Daniela Cabrera &nbsp;||&nbsp; &copy; 2024 Registro Contable. Todos los derechos reservados. &nbsp;||&nbsp;
          <a 
            href="https://github.com/Dancay5071" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white text-decoration-none mx-1"
          >
            Github: <i className="bi bi-github"></i>
          </a>
          &nbsp;
          <a 
            href="https://www.linkedin.com/in/daniela-cabrera5071" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white text-decoration-none mx-1"
          >
            LinkedIn: <i className="bi bi-linkedin"></i>
          </a>
          &nbsp;
          <a 
            href="mailto:daniinad175.may30@gmail.com" 
            className="text-white text-decoration-none mx-1"
          >
            Gmail: <i className="bi bi-envelope-at-fill"></i>
          </a>
        </p>
      </div>
    </footer>
  );
}

