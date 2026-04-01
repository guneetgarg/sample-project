describe('TS Example spec', () => {
  it('visits example.com and checks title', () => {
    cy.visit('https://example.com');
    cy.title().should('include', 'Example Domain');
  });
});
