import { Network, NETWORK } from '@gemwallet/constants';

const mockSessionStorage = {};

describe('Submit Transactions (Bulk)', () => {
  // deepcode ignore NoHardcodedPasswords: password used for testing purposes
  const PASSWORD = 'SECRET_PASSWORD';

  const transactions = [
    {
      ID: '001',
      TransactionType: 'Payment',
      Destination: 'rhikRdkFw28csKw9z7fVoBjWncz1HSoQij',
      Amount: '100000',
      Memos: [
        {
          Memo: {
            MemoData: '54657374206D656D6F',
            MemoType: '4465736372697074696F6E'
          }
        }
      ]
    },
    {
      ID: '002',
      TransactionType: 'TrustSet',
      LimitAmount: {
        currency: 'ETH',
        issuer: 'rnm76Qgz4G9G4gZBJVuXVvkbt7gVD7szey',
        value: '10000000'
      },
      Memos: [
        {
          Memo: {
            MemoType: '4465736372697074696f6e',
            MemoData: '54657374206d656d6f'
          }
        }
      ],
      Fee: '199'
    },
    {
      ID: '003',
      TransactionType: 'Payment',
      Destination: 'rhikRdkFw28csKw9z7fVoBjWncz1HSoQij',
      Amount: '100000',
      Memos: [
        {
          Memo: {
            MemoData: '54657374206D656D6F',
            MemoType: '4465736372697074696F6E'
          }
        }
      ]
    },
    {
      ID: '004',
      TransactionType: 'Payment',
      Destination: 'rhikRdkFw28csKw9z7fVoBjWncz1HSoQij',
      Amount: '100000',
      Memos: [
        {
          Memo: {
            MemoData: '54657374206D656D6F',
            MemoType: '4465736372697074696F6E'
          }
        }
      ]
    }
  ];

  const transactionsMap = transactions.reduce((acc, transaction, index) => {
    acc[index] = transaction;
    return acc;
  }, {});

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

  it('Submit Transactions', () => {
    const url = `http://localhost:3000?submit-transactions-bulk&storageKey=1693425372955.3833&id=93425114&requestMessage=undefined&submit=txBulk`;

    navigate(url, PASSWORD, '1693425372955.3833', {
      transactions: transactionsMap,
      waitForHashes: false
    });

    cy.contains('button', 'Enable Permission').click();

    // Check recap view data
    cy.contains('Total number of transactions').next().should('have.text', '4');

    cy.contains('Types of transactions:')
      .next()
      .should('have.text', 'Payment: 3')
      .next()
      .should('have.text', 'TrustSet: 1');

    cy.contains('Total network fees:')
      .next()
      .should('have.text', '0.000235 XRP', { timeout: 10000 });

    // Begin
    cy.contains('button', 'Begin').click();

    // Submit transactions
    cy.contains('button', 'Submit all').click();
    cy.contains('You are about to submit 4 transactions in bulk. Are you sure?');
    cy.contains('button', 'OK').click();

    cy.get('h1[data-testid="transaction-title"]').should('have.text', 'Transactions in progress');
    cy.get('p[data-testid="transaction-subtitle"]').should(
      'have.text',
      'We are processing your transactionsPlease wait'
    );

    cy.get('h1[data-testid="transaction-title"]').contains('Transactions accepted', {
      timeout: 30000
    });
    cy.get('p[data-testid="transaction-subtitle"]').should('have.text', 'Transactions Successful');
  });

  const navigate = (url: string, password: string, storageKey: string, transactions) => {
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
          },
          session: {
            set(obj, cb) {
              Object.assign(mockSessionStorage, obj);
              if (cb) cb();
            },
            get(key, cb) {
              cb(mockSessionStorage[key]);
            },
            remove(key, cb) {
              delete mockSessionStorage[key];
              if (cb) cb();
            }
          }
        };

        (win as any).chrome.storage.session.set({
          [storageKey]: { [storageKey]: JSON.stringify(transactions) }
        });

        (win as any).chrome.runtime.lastError = null;
      }
    });

    // Login
    cy.get('input[name="password"]').type(password);
    cy.contains('button', 'Unlock').click();
  };
});
