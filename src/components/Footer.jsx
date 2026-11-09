import React from "react";
import FinTrackLogo from "./FinTrackLogo";

export default function Footer() {
  return (
    <footer className="app-footer mt-auto py-3">
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          
          <div className="d-flex flex-column flex-sm-row align-items-center gap-2 text-center text-md-start">
            <div className="d-flex align-items-center gap-2">
              <FinTrackLogo size={24} showText={true} textClass="fs-6" />
              <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2" style={{ fontSize: "0.72rem" }}>
                v2.0
              </span>
            </div>
            <span className="text-secondary opacity-50 d-none d-sm-inline">•</span>
            <span className="small">
              &copy; {new Date().getFullYear()} FinTrack &bull; Desarrollado por{" "}
              <strong className="footer-author-name">Daniela Cabrera</strong>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 footer-social-links">
            <a 
              href="https://github.com/Dancay5071" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link-pill"
              title="Perfil de GitHub"
              aria-label="GitHub"
            >
              <i className="bi bi-github"></i>
              <span className="d-none d-sm-inline">GitHub</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/daniela-cabrera5071" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link-pill"
              title="Perfil de LinkedIn"
              aria-label="LinkedIn"
            >
              <i className="bi bi-linkedin"></i>
              <span className="d-none d-sm-inline">LinkedIn</span>
            </a>
            <a 
              href="mailto:daniinad175.may30@gmail.com" 
              className="footer-link-pill"
              title="Enviar correo a Daniela Cabrera"
              aria-label="Gmail"
            >
              <i className="bi bi-envelope-at-fill"></i>
              <span className="d-none d-sm-inline">Contacto</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
