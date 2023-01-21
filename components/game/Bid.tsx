import { Button, FormControl, FormLabel, Heading, Input, Text, VStack } from '@chakra-ui/react';
import { FC, useState } from 'react';

type Props = {
    title: string;
    beanBalance: number;
    onSubmit: (amount: number) => void;
}

const Bid: FC<Props> = (props) => {
    const [bidAmmount, setBidAmmount] = useState(0);
    const [currentBid, setCurrentBid] = useState(0);

    function onButtonClick() {
        if (bidAmmount <= props.beanBalance) {
            setCurrentBid(bidAmmount);
            props.onSubmit(bidAmmount);
            setBidAmmount(0);
        }
    }

    return (
        <VStack spacing='1rem'>
            <Heading as='h1'>Bid on: {props.title}</Heading>
            <Text fontSize='xl'>Avalible beans: {props.beanBalance}</Text>
            <Text fontSize='xl'>Current bid: {currentBid}</Text>
            <FormControl>
                <FormLabel>Beans to bid</FormLabel>
                <Input
                    isInvalid={bidAmmount > props.beanBalance}
                    fontWeight='bold'
                    value={bidAmmount}
                    type='number'
                    onChange={(e) => setBidAmmount(+e.target.value)} />
                    {bidAmmount > props.beanBalance && (
                        <p className="error">Bid cannot be more than the avalible beans</p>
                    )}
            </FormControl>
            <Button onClick={onButtonClick} colorScheme='whatsapp'>Submit</Button>
        </VStack>
    );
}

export default Bid;