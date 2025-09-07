import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 py-2 w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              © 2025 Yscenes. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="/terms-of-service" 
              className="text-sm hover:text-white transition-colors duration-200"
            >
              Terms of Service
            </a>
            <a 
              href="/privacy-policy" 
              className="text-sm hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
