import { AddIcon, ChevronDownIcon, DeleteIcon, DragHandleIcon } from '@chakra-ui/icons';
import { Box, Button, Center, FormLabel, Heading, HStack, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Stack, Text } from '@chakra-ui/react';
import axios, { AxiosResponse } from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Trial } from 'database/models/game';
import styles from './new.module.scss';

// Have to use the old require syntax for this, as it's lacking TS support
// eslint-disable-next-line
const Reorder = require('react-reorder');
const reorder = Reorder.reorder;



type FormData = {
    starterBeanCount: number;
    trials: Array<Trial>
}

const NewTrialPage: FC = () => {
    const [formData, setFormData] = useState<FormData>({ starterBeanCount: 1000, trials: [] });
    const [addData, setAddData] = useState({ type: '', title: '', timeLimit: 1 });
    const [errors, setErrors] = useState<string | undefined>();
    const router = useRouter();

    function addTrial() {
        const newArray = [...formData.trials];

        newArray.push(addData);
        setAddData({ type: '', title: '', timeLimit: 1 });

        setFormData({ ...formData, trials: newArray });
    }

    function updateFormData(index: number, value: string, key: string) {
        const copy = [...formData.trials] as unknown as Array<Record<string, string>>;
        copy[index][key] = value;
        setFormData({ ...formData, trials: copy as unknown as Array<Trial> })
    }

    function deleteTrial(index: number) {
        const copy = [...formData.trials];
        copy.splice(index, 1);
        setFormData({ ...formData, trials: copy });
    }

    // Have to use any a sthis package doesn't have TS support
    // eslint-disable-next-line
    function onReorder(event: any, previousIndex: any, nextIndex: any, fromId: any, toId: any) {
        setFormData({
            ...formData,
            trials: reorder(formData.trials, previousIndex, nextIndex)
        });
    }

    async function start() {
        if (formData.trials.length === 0) {
            setErrors('There needs to be atleast one trial');
            return;
        }

        try {
            const body: CreateGameBody = { ...formData };
            const response = await axios.post<CreateGameBody, AxiosResponse<CreateGameResponse>>('/api/game/create', body);
            if (response.status === 200) {
                router.push(`/host/${response.data.gameId}`)
            }
        } catch (e) {
            setErrors('There was an issue creating this trial... Try again in a bit ');
        }
    }

    return (
        <>
            <Head>
                <title>Trial By Fire - New Trial</title>
            </Head>
            <Stack className={styles.main} spacing='1rem'>
                <Heading as='h1'>Create a trial</Heading>
                <Box maxW='container.lg' borderWidth='0' borderRadius='lg'>
                    <HStack>
                        <label htmlFor='starter-bean-count'>Beans to start with</label>
                        <NumberInput
                            id='starter-bean-count'
                            value={formData.starterBeanCount}
                            onChange={(e) => setFormData({ ...formData, starterBeanCount: +e })}
                            defaultValue={1000}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </HStack>
                </Box>
                <Reorder
                    reorderId="trials-list"
                    lock="horizontal"
                    onReorder={onReorder}
                    holdTime={100}
                    autoScroll={true}
                    disableContextMenus={true}
                >
                    {formData.trials.map((value, index) => (
                        <Box
                            key={index}
                            maxW='container.lg'
                            borderWidth='0'
                            borderRadius='lg'
                            style={{ marginBottom: index === formData.trials.length - 1 ? 0 : '1rem' }}
                        >
                            <HStack>
                                <Input value={value.title} onChange={(e) => updateFormData(index, e.target.value, 'title')} placeholder='Trial title' size='md' />
                                <Select value={value.type} onChange={(e) => updateFormData(index, e.target.value, 'type')} icon={<ChevronDownIcon />} placeholder='Trial type'>
                                    <option>Time trial</option>
                                    <option>Fastest</option>
                                </Select>
                                <Button onClick={() => deleteTrial(index)} style={{ padding: '0 25px' }} leftIcon={<DeleteIcon />} colorScheme='red' variant='solid'>
                                    Delete
                                </Button>
                                <DragHandleIcon style={{ cursor: 'grab' }} />
                            </HStack>
                        </Box>
                    ))}
                </Reorder>
                <Box maxW='container.lg' borderWidth='0' borderRadius='lg'>
                    <HStack>
                        <Input value={addData.title} onChange={(e) => setAddData({ ...addData, title: e.target.value })} placeholder='Trial title' size='md' />
                        <Select value={addData.type} onChange={(e) => setAddData({ ...addData, type: e.target.value })} icon={<ChevronDownIcon />} placeholder='Trial type'>
                            <option>Time trial</option>
                            <option>Fastest</option>
                        </Select>
                        {addData.type === 'Time trial' && (
                            <NumberInput
                                value={addData.timeLimit}
                                onChange={(e) => setAddData({ ...addData, timeLimit: +e })}
                                precision={1}
                                step={0.1}
                            >
                                <NumberInputField />
                                <FormLabel className={styles.floatingLabel}>Time limit (mins)</FormLabel>
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        )}
                        <Button onClick={addTrial} style={{ padding: '0 25px' }} leftIcon={<AddIcon />} colorScheme='teal' variant='solid'>
                            Add
                        </Button>
                    </HStack>
                </Box>
                {errors && <p className='error'>{errors}</p>}
                <Center>
                    <Button onClick={start} colorScheme='whatsapp'>Start</Button>
                </Center>
                <Text>Want to save this for later? <Link href='/signup'>Create an account</Link></Text>
            </Stack>
        </>
    )
}

export default NewTrialPage;