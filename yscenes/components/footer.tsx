import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-2 mt-12 relative bottom-0 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              © 2024 Yscenes. All rights reserved.
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
