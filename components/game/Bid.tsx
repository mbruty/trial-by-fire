import { Button, Center, FormControl, FormLabel, Heading, Input, Text, VStack } from '@chakra-ui/react';
import useSocket from 'hooks/useSocket';
import { FC, useEffect, useState } from 'react';

type Props = {
    title: string;
    beanBalance: number;
}

const Bid: FC<Props> = (props) => {
    const [bidAmmount, setBidAmmount] = useState<number | undefined>();
    const [currentBid, setCurrentBid] = useState<number>(0);
    const [bidError, setBidError] = useState('');
    const socket = useSocket();

    useEffect(() => {
        const id = socket.subscribeToBidErrors((data: string) => {
            setBidError(data);
        });

        const successId = socket.subscribeToBidSuccess((data: number) => {
            setCurrentBid(data);
        })

        return () => {
            socket.unsubscribeBidSuccess(successId);
            socket.unsubscribeBidErrors(id);
        }
    }, [socket]);

    function onButtonClick() {
        if (bidAmmount === undefined) {
            setBidError('You need to provide a bid first');
        }
        else if (bidAmmount <= props.beanBalance) {
            socket.bid(bidAmmount);
            setBidAmmount(undefined);
        }
    }

    if (bidAmmount === 0) {
        setBidAmmount(undefined);
    }

    return (
        <VStack spacing='1rem'>
            <Heading as='h1'>Bid on: {props.title}</Heading>
            <Text fontSize='xl'>Avalible beans: {props.beanBalance}</Text>
            <Text fontSize='xl'>Current bid: {currentBid}</Text>
            <FormControl>
                <FormLabel>Beans to bid</FormLabel>
                <Input
                    isInvalid={bidAmmount !== undefined && bidAmmount > props.beanBalance}
                    fontWeight='bold'
                    value={bidAmmount}
                    type='number'
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                            setBidAmmount(value)
                        }
                    }}
                />
                <Center>
                    <Button margin='1rem' onClick={onButtonClick} colorScheme='whatsapp'>Submit</Button>
                </Center>
                <div style={{ padding: '1rem ' }} />
                {bidAmmount !== undefined && bidAmmount > props.beanBalance && (
                    <p className="error">Bid cannot be more than the avalible beans</p>
                )}

                {bidError && (
                    <p className="error">{bidError}</p>
                )}
            </FormControl>
        </VStack>
    );
}

export default Bid;