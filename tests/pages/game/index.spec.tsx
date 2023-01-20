import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest'
import { getServerSideProps } from 'pages/game/index';
import { ContextWithCookies } from 'types/ContextWithCookies';
import Index from 'pages/game/index'

vi.mock('cookies-next');
vi.mock('next/router');
vi.mock('next/head');


test('getServerSideProps returns redirect with correct cookies present', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = 'a';
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game/rejoin');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps returns nothing with no cookies present', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeUndefined();
});

test('Page sets title', async () => {
    render(<Index />, { container: document.head });

    expect(document.title).toBe('Trials by fire - Join a game');
});

test('Page has all required inputs', async () => {
    render(<Index />);

    expect(document.getElementById('game-code')).toBeInTheDocument();
    expect(document.getElementById('name')).toBeInTheDocument();
    expect(document.getElementById('in-person')).toBeInTheDocument();
    expect(document.getElementById('remote')).toBeInTheDocument();
});

test('Game code errors visable', async () => {
    render(<Index />);

    await act(async () => {
        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.findByText('Game code cannot be empty')).toBeInTheDocument();
    expect(
        await screen.findByText(
            'Is this meant to be a valid number, or are your friends playing tricks on you?'
        )
    ).toBeInTheDocument();

    expect(await screen.findByText('Game Code must be in the format 11-22-33')).toBeInTheDocument();
});

test('Game code errors visable with too short of a code', async () => {
    render(<Index />);

    await act(async () => {
        const input = await screen.findByTestId('game-code');
        fireEvent.change(input, { target: { value: '11-22' } });
        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.queryByText('Game code cannot be empty')).toBeNull();

    expect(
        await screen.findByText(
            'Is this meant to be a valid number, or are your friends playing tricks on you?'
        )
    ).toBeInTheDocument();

    expect(await screen.findByText('Game Code must be in the format 11-22-33')).toBeInTheDocument();
});

test('Game code errors visable with correct length, but incorrect format', async () => {
    render(<Index />);

    await act(async () => {
        const input = await screen.findByTestId('game-code');
        fireEvent.change(input, { target: { value: 'aa-bb-cc' } });
        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.queryByText('Game code cannot be empty')).toBeNull();

    expect(
        await screen.queryByText(
            'Is this meant to be a valid number, or are your friends playing tricks on you?'
        )
    ).toBeNull();

    expect(await screen.findByText('Game Code must be in the format 11-22-33')).toBeInTheDocument();
});

test('Game code errors not visable with correct length and format', async () => {
    render(<Index />);

    await act(async () => {
        const input = await screen.findByTestId('game-code');
        fireEvent.change(input, { target: { value: '11-11-11' } });

        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.queryByText('Game code cannot be empty')).toBeNull();

    expect(
        await screen.queryByText(
            'Is this meant to be a valid number, or are your friends playing tricks on you?'
        )
    ).toBeNull();

    expect(await screen.queryByText('Game Code must be in the format 11-22-33')).toBeNull();
});

test('Name errors visable with empty name', async () => {
    render(<Index />);

    await act(async () => {
        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });
    expect(await screen.findByText('Name cannot be empty')).toBeInTheDocument();

    expect(await screen.queryByText('Your name is too long!')).toBeNull();
});

test('Name errors visable with too long of a name', async () => {
    render(<Index />);

    await act(async () => {
        const input = await screen.findByTestId('name');
        fireEvent.change(input, { target: { value: 'This is an obscelenly long name, and frankly would probably break my CSS, or at the very least look ugly' } });

        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });
    expect(await screen.queryByText('Name cannot be empty')).toBeNull();

    expect(await screen.findByText('Your name is too long!')).toBeInTheDocument();
});

test('Name errors not visable correct name', async () => {
    render(<Index />);

    await act(async () => {
        const input = await screen.findByTestId('name');
        // Use the best name out there
        fireEvent.change(input, { target: { value: 'Mike' } });

        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });
    expect(await screen.queryByText('Name cannot be empty')).toBeNull();

    expect(await screen.queryByText('Your name is too long!')).toBeNull();
});

test('Is remote errors not visable when remote selected', async () => {
    render(<Index />);

    await act(async () => {
        const radio = await screen.findByTestId('remote');
        fireEvent.click(radio);

        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.queryByText('Please select if you are in person, or remote')).toBeNull();
});

test('Is remote errors not visable when remote in person is selected', async () => {
    render(<Index />);
    await act(async () => {
        const radio = await screen.findByTestId('in-person');
        fireEvent.click(radio);

        const button = await screen.findByRole('button');
        fireEvent.click(button);
    });

    expect(await screen.queryByText('Please select if you are in person, or remote')).toBeNull();
});