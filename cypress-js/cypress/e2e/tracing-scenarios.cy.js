/**
 * Test file to validate different Cypress command scenarios for tracing
 */

describe('Tracing Scenarios - Basic Commands', () => {
  it('should trace visit and title commands', () => {
    cy.visit('https://example.com');
    cy.title().should('include', 'Example Domain');
  });

  it('should trace element interactions', () => {
    cy.visit('https://example.com');
    
    // Get elements
    cy.get('h1').should('be.visible');
    cy.get('p').should('exist');
    
    // Contains - use text that's always present
    cy.contains('Example Domain').should('exist');
  });

  it('should trace assertions', () => {
    cy.visit('https://example.com');
    
    // Multiple assertions
    cy.get('h1')
      .should('be.visible')
      .and('have.text', 'Example Domain');
    
    cy.url().should('include', 'example.com');
  });
});

describe('Tracing Scenarios - Wait and Timing', () => {
  it('should trace explicit waits', () => {
    cy.visit('https://example.com');
    cy.wait(500);
    cy.get('h1').should('exist');
    cy.wait(500);
  });

  it('should trace timeout scenarios', () => {
    cy.visit('https://example.com');
    cy.get('h1', { timeout: 10000 }).should('be.visible');
  });
});

describe('Tracing Scenarios - Viewport', () => {
  it('should trace viewport changes', () => {
    cy.viewport(1280, 720);
    cy.visit('https://example.com');
    
    cy.viewport('iphone-x');
    cy.get('h1').should('be.visible');
    
    cy.viewport(1920, 1080);
  });
});
