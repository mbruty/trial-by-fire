/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from 'axios';
import { SocketObservable } from 'contexts/websocketContext';

let currentGame: CreateGameResponse | undefined;
describe('Host integration tests', () => {
    beforeEach(async () => {
        await fetch('http://localhost:3000/api/tests/dropAll');
        const game: CreateGameBody = {
            starterBeanCount: 100,
            trials: [{
                title: 'Trial one',
                type: 'Fastest'
            }, {
                title: 'Trial two',
                type: 'Time trial'
            }],

        }
        const data = await axios.post<CreateGameBody, AxiosResponse<CreateGameResponse>>('/api/game/create', game);
        currentGame = data.data;
    })
    it('Can join a game', () => {

        cy.visit('/game');
        // This request is fired off at the start, so give react a chance to hydrate
        cy.intercept('/api/ws/socket-io').as('dev');
        cy.wait('@dev');

        cy.get('#game-code').type(currentGame?.code ?? '');
        cy.get('#name').type('Mike');
        cy.get('button').click();

        cy.url().should('eq', 'http://localhost:3000/game/setup');
        cy.get('h1').should('have.text', 'Hello Mike');
    });

    it('Can complete setup', () => {
        cy.visit('/game');
        // This request is fired off at the start, so give react a chance to hydrate
        cy.intercept('/api/ws/socket-io').as('dev');
        cy.wait('@dev');

        cy.get('#game-code').type(currentGame?.code ?? '');
        cy.get('#name').type('Mike');
        cy.get('button').click();
        // Wait for the camera to load
        cy.wait(1000);
        cy.get('button').click();

        cy.intercept('/api/game/' + currentGame?.gameId).as('game')
        cy.intercept('/api/image/upload').as('image');
        cy.get('#save').click();

        cy.wait('@image');

        cy.visit('/host/lobby/' + currentGame?.gameId);
        cy.get('[alt="Player Mike\'s avatar"]').should('be.visible').and((img: any) => {
            expect(img[0].srcset).to.not.eq(undefined);
            expect(img[0].srcset).to.contain('storage.googleapis.com');
        })

    });

    it('Recieves a start update from the socket on game start', () => {
        cy.visit('/game');
        // This request is fired off at the start, so give react a chance to hydrate
        cy.intercept('/api/ws/socket-io').as('dev');
        cy.wait('@dev');



        cy.get('#game-code').type(currentGame?.code ?? '');
        cy.get('#name').type('Mike');
        cy.get('button').click();
        // Wait for the camera to load
        cy.wait(1000);
        cy.get('button').click();

        cy.intercept('/api/game/' + currentGame?.gameId).as('game')
        cy.intercept('/api/image/upload').as('image');
        cy.get('#save').click();

        cy.wait('@image').then(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const socketObserver: SocketObservable = window.Cypress.ws;
            expect(socketObserver).to.not.eq(undefined);
            const cb = cy.stub().as('start');
            const startid = socketObserver.subscribeToStart(cb);
            socketObserver.startGame(currentGame?.code ?? '');

            cy.wait(1000).then(() => {
                console.log('ye');
                cy.get('@start').should('be.calledOnce');
                socketObserver.unsubscribeStart(startid);
            })
        })

    })
});