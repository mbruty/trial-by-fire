import axios, { AxiosResponse } from 'axios';
import { SocketObservable } from 'contexts/websocketContext';
import { IGame } from 'database/models/game';

let game: IGame | undefined;

describe('Host integration tests', () => {
  beforeEach(async () => {
    const response = await fetch('/api/games');
    const games = await response.json();
    game = games[0];
  })

  it('Visit home page contains title and create a game', () => {
    cy.visit('/');
    // Ensure that socket io is started
    cy.intercept('/api/ws/socket-io').as('socket-io');
    cy.wait('@socket-io').its('response.statusCode').should('eq', 200);
    cy.contains('Welcome to trials by fire!').should('be.visible');
    cy.contains('Create a new game').should('be.visible');
  });

  it('Can navigate to create a new game', () => {
    cy.visit('/');
    // This request is fired off at the start, so give react a chance to hydrate
    cy.intercept('/api/ws/socket-io').as('dev');
    cy.wait('@dev');
    cy.get('#new').click();
    cy.url().should('eq', 'http://localhost:3000/host/new');
  });

  it('Can create a game', () => {
    cy.visit('/host/new');
    // This request is fired off at the start, so give react a chance to hydrate
    cy.intercept('/api/ws/socket-io').as('dev');
    cy.wait('@dev');
    // Add some data
    cy.get('input[placeholder="Trial title"]').type('Trial one');
    cy.get('.chakra-select').select('Time trial');
    cy.get('#add').click();

    cy.get('#title-0').should('have.value', 'Trial one');
    cy.get('#start').click();

    cy.url().should('contain', 'http://localhost:3000/host/lobby/');

    cy.intercept('/api/game/*').as('game');
    cy.url().then(async (url) => {
      const id = url.split('/').pop();
      const result = await fetch('/api/game/' + id);
      const data = await result.json();
      console.log(data);
      cy.wait('@game')
        .its('response.body._id').should('eq', id);

      expect(data.rounds[0].title).to.eq('Trial one');
      expect(data.rounds[0].type).to.eq('Time trial');
      cy.get('#code').should('contain.text', data.code);
    });
  });

  it('Can start a game', () => {
    // Just to make TS happy, it shouldn't be undefined
    if (!game) return;
    // Create some dummy users
    const playerOne: JoinRoomBody = {
      gameCode: game.code,
      isRemote: false,
      name: 'Player one'
    }

    cy.intercept('/api/game/join').as('join');
    axios.post<JoinRoomBody, AxiosResponse<JoinRoomResponse>>('/api/game/join', playerOne);

    const playerTwo: JoinRoomBody = {
      gameCode: game.code,
      isRemote: false,
      name: 'Player two'
    }
    axios.post<JoinRoomBody, AxiosResponse<JoinRoomResponse>>('/api/game/join', playerTwo);

    const playerThree: JoinRoomBody = {
      gameCode: game.code,
      isRemote: false,
      name: 'Player three'
    }
    axios.post<JoinRoomBody, AxiosResponse<JoinRoomResponse>>('/api/game/join', playerThree);

    cy.wait('@join');
    cy.wait('@join');

    expect(game).to.not.eq(undefined);
    cy.visit('/host/lobby/' + game._id);

    // This request is fired off at the start, so give react a chance to hydrate
    cy.intercept('/api/ws/socket-io').as('dev');
    cy.wait('@dev');

    cy.get('[data-test-id="player-Player one"]').should('be.visible');
    cy.get('[data-test-id="player-Player two"]').should('be.visible');


    cy.wait(500).then(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const socketObserver: SocketObservable = window.Cypress.ws;
      expect(socketObserver).to.not.eq(undefined);

      const state = cy.stub().as('state');
      const stateId = socketObserver.subscribeToState(state);
      cy.get('button').click();

      cy.get('@state').should('be.called').then(() => {
        cy.get('table').contains('td', 'Player one');
      });

      // Clean up socket listeners
      socketObserver.unsubscribeStart(stateId);
    });
  });

  it('Can start & restart bidding', () => {
    // Just to make TS happy, it shouldn't be undefined
    if (!game) return;
    cy.visit('/host/play/' + game._id);
    cy.get('button')
      .click()
      .then(() => {
        cy.get('h1').should('have.text', 'Place your bids');
        cy.wait(31000).then(() => {
          cy.get('.error').should('have.text', 'Less than two people have bid');

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const socketObserver: SocketObservable = window.Cypress.ws;
          expect(socketObserver).to.not.eq(undefined);
          const stateUpdate = cy.stub().as('stateUpdate');

          socketObserver.subscribeToState(stateUpdate);
          cy.get('button').eq(1).click().then(() => {
            cy.get('@stateUpdate').should('be.calledOnce');
            cy.get('.error').should('not.exist');
          });
        });
      });
  });

  it('Can updates on bid', () => {
    // Just to make TS happy, it shouldn't be undefined
    if (!game) return;
    cy.visit('/host/play/' + game._id)
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const socketObserver: SocketObservable = window.Cypress.ws;
        expect(socketObserver).to.not.eq(undefined);
        // Mock that we are the 0th player
        cy.setCookie('id', game?.players[0]._id.toString() ?? '').then(() => {
          socketObserver.bid(100);
        });
      });
  })
})