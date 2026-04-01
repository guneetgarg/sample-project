describe('JS Example spec', () => {
  it('should trace visit and title commands', () => {
    // Navigate to example.com  
    cy.visit('https://example.com');
    
    // Check the title
    cy.title().should('include', 'Example');
  });
  
  it('should trace element interactions', () => {
    cy.visit('https://example.com');
    
    // Get h1 element
    cy.get('h1').should('be.visible');
    
    // Get link
    cy.get('a').should('exist');
    
    // Get paragraph
    cy.get('p').first().should('be.visible');
  });
});
