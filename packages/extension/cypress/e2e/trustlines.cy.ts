/// <reference types="cypress" />

import { Network, NETWORK } from '@gemwallet/constants';

describe('Trustline', () => {
  // deepcode ignore NoHardcodedPasswords: password used for testing purposes
  const PASSWORD = 'SECRET_PASSWORD';
  const CURRENCY = 'USD';
  const DESTINATION_ADDRESS = 'rwtDvu9QDfCskWuyE2TSEt3s56RbiWUKJN';
  const VALUE = '10000000';
  const AMOUNT = JSON.stringify({
    currency: CURRENCY,
    value: VALUE,
    issuer: DESTINATION_ADDRESS
  });
  const FLAGS = JSON.stringify({
    tfSetNoRipple: true
  });
  const HOME_URL = `http://localhost:3000`;
  const SET_TRUSTLINE_URL = `${HOME_URL}?limitAmount=${AMOUNT}&flags=${FLAGS}&id=93376196&requestMessage=REQUEST_SET_TRUSTLINE/V3&inAppCall=true&transaction=trustSet`;

  beforeEach(() => {
    // Mock the localStorage with a wallet already loaded
    cy.window().then((win) => {
      win.localStorage.setItem(
        'wallets',
        'U2FsdGVkX19VA07d7tVhAAtUbt+YVbw0xQY7OZMykOW4YI4nRZK9iZ7LT3+xHvrj4kwlPKEcRg0S1GjbIWSFaMzg3Mw8fklZrZLL9QZvnbF821SeDB5lBBj/F9PBg8A07uZhYz1p4sTDsWAOFvrnKJjmlWIqXzN5MFFbWBb3os2xGtAGTslFVUXuTp6eM9X9'
      );
      win.localStorage.setItem(
        'network',
        JSON.stringify({
          name: NETWORK[Network.TESTNET].name
        })
      );
    });
  });

  it("Reject the trustline's warning", () => {
    navigate(SET_TRUSTLINE_URL, PASSWORD);

    cy.on('uncaught:exception', (err, runnable) => {
      // Continue with the test
      return false;
    });
    // Should be on the Warning Trustline Page
    cy.get('h1[data-testid="page-title"]').should('have.text', 'Set Trustline');

    // Should have the proper information
    cy.get('h1[data-testid="page-title"]')
      .next()
      .should(
        'have.text',
        'WarningGemWallet does not recommend or support any particular token or issuer.It is important to add only the tokens and issuers you trust.Continue at your own risk'
      );

    // Reject the trustline
    cy.contains('button', 'Reject').click();
    cy.get('h1[data-testid="transaction-title"]').should('have.text', 'Transaction rejected');
    cy.get('p[data-testid="transaction-subtitle"]').should(
      'have.text',
      'Your transaction failed, please try again.Something went wrong'
    );
  });

  it('Confirm the trustline', () => {
    navigate(SET_TRUSTLINE_URL, PASSWORD);

    cy.on('uncaught:exception', (err, runnable) => {
      // Continue with the test
      return false;
    });
    validateTrustlineTx(DESTINATION_ADDRESS, CURRENCY, '10,000,000');
  });

  it('Reject the trustline', () => {
    navigate(SET_TRUSTLINE_URL, PASSWORD);

    cy.on('uncaught:exception', (err, runnable) => {
      // Continue with the test
      return false;
    });

    // Should be on the Warning Trustline Page
    cy.get('h1[data-testid="page-title"]').should('have.text', 'Set Trustline');

    // Should have the proper information
    cy.get('h1[data-testid="page-title"]')
      .next()
      .should(
        'have.text',
        'WarningGemWallet does not recommend or support any particular token or issuer.It is important to add only the tokens and issuers you trust.Continue at your own risk'
      );

    // Confirm the trustline warning
    cy.contains('button', 'Continue').click();

    // Should be on the Add Trustline Page
    cy.get('h1[data-testid="page-title"]').should('have.text', 'Set Trustline');

    // Should have the proper information
    cy.contains('Issuer:').next().should('have.text', DESTINATION_ADDRESS);
    cy.contains('Currency:').next().should('have.text', CURRENCY);
    cy.contains('Limit:').next().should('have.text', `10,000,000 ${CURRENCY}`);

    // Confirm the trustline
    cy.contains('button', 'Reject').click();

    cy.get('h1[data-testid="transaction-title"]').should('have.text', 'Transaction rejected');
    cy.get('p[data-testid="transaction-subtitle"]').should(
      'have.text',
      'Your transaction failed, please try again.Something went wrong'
    );
  });

  it('Confirm SOLO (non hex)', () => {
    const amount = JSON.stringify({
      currency: 'SOLO',
      value: '10000000',
      issuer: 'rHZwvHEs56GCmHupwjA4RY7oPA3EoAJWuN'
    });
    const url = `${HOME_URL}?limitAmount=${amount}&flags=${FLAGS}&id=93376196&requestMessage=REQUEST_SET_TRUSTLINE/V3&inAppCall=true&transaction=trustSet`;
    navigate(url, PASSWORD);

    cy.on('uncaught:exception', (err, runnable) => {
      // Continue with the test
      return false;
    });
    validateTrustlineTx('rHZwvHEs56GCmHupwjA4RY7oPA3EoAJWuN', 'SOLO', '10,000,000');
  });

  it('Confirm SOLO (hex)', () => {
    const amount = JSON.stringify({
      currency: '534F4C4F00000000000000000000000000000000',
      value: '10000000',
      issuer: 'rHZwvHEs56GCmHupwjA4RY7oPA3EoAJWuN'
    });
    const url = `${HOME_URL}?limitAmount=${amount}&flags=${FLAGS}&id=93376196&requestMessage=REQUEST_SET_TRUSTLINE/V3&inAppCall=true&transaction=trustSet`;
    navigate(url, PASSWORD);

    cy.on('uncaught:exception', (err, runnable) => {
      // Continue with the test
      return false;
    });
    validateTrustlineTx('rHZwvHEs56GCmHupwjA4RY7oPA3EoAJWuN', 'SOLO', '10,000,000');
  });

  const testCases = [
    {
      issuer: 'rwtDvu9QDfCskWuyE2TSEt3s56RbiWUKJN',
      token: 'USD',
      limit: '10000000',
      formattedLimit: '10,000,000'
    },
    {
      issuer: 'rHZwvHEs56GCmHupwjA4RY7oPA3EoAJWuN',
      token: 'SOLO',
      limit: '100000000',
      formattedLimit: '100,000,000'
    }
  ];

  testCases.forEach((testCase) => {
    it(`Set a trustline from the UI with ${testCase.token}`, () => {
      navigate(HOME_URL, PASSWORD);

      cy.contains('button', 'Add trustline').click();

      // Should be on the Add Trustline Page
      cy.get('p').should('have.text', 'Add trustline');

      // Fill the form
      cy.get('input[id="issuer"]').type(testCase.issuer);

      cy.get('input[name="token"]').type(testCase.token);

      cy.get('input[name="limit"]').type(testCase.limit);

      // Confirm the trustline
      cy.contains('button', 'Add trustline').click();

      validateTrustlineTx(testCase.issuer, testCase.token, testCase.formattedLimit);
    });
  });

  it('Edit the trustline by disabling No Ripple', () => {
    const newLimit = '5';
    navigate(HOME_URL, PASSWORD);

    // Find the trustline to edit
    cy.contains(CURRENCY).closest('.MuiPaper-root').find('button').contains('Edit').click();

    // Change the limit
    cy.get('input[name="limit"]').clear();
    cy.get('input[name="limit"]').type(newLimit);

    // Change the rippling
    cy.get('input[name="noRipple"]').should('be.checked'); // No Ripple is initially true
    cy.get('input[name="noRipple"]').uncheck();

    // Confirm the trustline
    cy.contains('button', 'Edit trustline').click();
    cy.contains('button', 'Continue').click();

    // Check values in the confirmation page
    cy.contains('Limit:').next().should('have.text', `${newLimit} ${CURRENCY}`);

    // Confirm
    cy.contains('button', 'Confirm').click();

    cy.get('h1[data-testid="transaction-title"]').should('have.text', 'Transaction in progress');

    cy.get('p[data-testid="transaction-subtitle"]').should(
      'have.text',
      'We are processing your transactionPlease wait'
    );

    cy.get('h1[data-testid="transaction-title"]').contains('Transaction accepted', {
      timeout: 10000
    });
    cy.get('p[data-testid="transaction-subtitle"]').should('have.text', 'Transaction Successful');

    // Close
    cy.contains('button', 'Close').click();

    // Check that the trustline was updated
    cy.contains(CURRENCY).closest('.MuiPaper-root').find('button').contains('Edit').click();

    cy.get('input[name="limit"]').should('have.value', '5');
    cy.get('input[name="noRipple"]').should('not.be.checked');
  });
});

const navigate = (url: string, password: string) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      (win as any).chrome = (win as any).chrome || {};
      (win as any).chrome.runtime = {
        sendMessage(message, cb) {}
      };

      (win as any).chrome.storage = {
        local: {
          get(key, cb) {},
          set(obj, cb) {
            if (cb) cb();
          }
        }
      };

      cy.stub((win as any).chrome.runtime, 'sendMessage').resolves({});
    }
  });

  // Login
  cy.get('input[name="password"]').type(password);
  cy.contains('button', 'Unlock').click();
};

const validateTrustlineTx = (destinationAddress: string, currency: string, limit: string) => {
  // Should be on the Warning Trustline Page
  cy.get('h1[data-testid="page-title"]').should('have.text', 'Set Trustline');

  // Should have the proper information
  cy.get('h1[data-testid="page-title"]')
    .next()
    .should(
      'have.text',
      'WarningGemWallet does not recommend or support any particular token or issuer.It is important to add only the tokens and issuers you trust.Continue at your own risk'
    );

  // Confirm the trustline warning
  cy.contains('button', 'Continue').click();

  // Should be on the Add Trustline Page
  cy.get('h1[data-testid="page-title"]').should('have.text', 'Set Trustline');

  // Should have the proper information
  cy.contains('Issuer:').next().should('have.text', destinationAddress);
  cy.contains('Currency:').next().should('have.text', currency);
  cy.contains('Limit:').next().should('have.text', `${limit} ${currency}`);

  // Confirm the trustline
  cy.contains('button', 'Confirm').click();

  cy.get('h1[data-testid="transaction-title"]').should('have.text', 'Transaction in progress');
  cy.get('p[data-testid="transaction-subtitle"]').should(
    'have.text',
    'We are processing your transactionPlease wait'
  );

  cy.get('h1[data-testid="transaction-title"]').contains('Transaction accepted', {
    timeout: 10000
  });
  cy.get('p[data-testid="transaction-subtitle"]').should('have.text', 'Transaction Successful');
};
