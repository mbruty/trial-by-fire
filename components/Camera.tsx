import React, { useState } from 'react'
import Webcam from 'react-webcam'
import { Button, HStack } from '@chakra-ui/react'

type VideoConstraints = {
    width: number;
    height: number;
    facingMode: string;
}

type CameraProps = {
    imgSrc: string;
    onSubmit: (data: string) => void;
    onReset: () => void;
    isSaved: boolean;
}

const Camera: React.FC<CameraProps> = (props) => {
    const [picture, setPicture] = useState(props.imgSrc)
    const webcamRef = React.useRef(null)
    const [videoConstraints, setVideoConstraints] = React.useState<VideoConstraints | null>(null);
    const capture = React.useCallback(() => {
        if (webcamRef.current != null) {
            const ref = webcamRef.current as Webcam;
            const pictureSrc = ref.getScreenshot();
            if (pictureSrc) {
                setPicture(pictureSrc)
            }
        }
    }, []);

    // Only run this code on the website, no ssr
    React.useEffect(() => {
        const width = window.innerWidth > 400 ? 400 : window.innerWidth;

        const videoConstraints = {
            width: width,
            height: width,
            facingMode: 'user',
        };

        setVideoConstraints(videoConstraints);
    }, []);

    if (!videoConstraints) {
        return null;
    }

    return (
        <>
            {!props.isSaved && <p>First, upload an avatar. This will be deleted after the game has finished</p>}
            {props.isSaved && <p></p>}
            <div>
                {picture == '' ? (
                    <Webcam
                        audio={false}
                        height={videoConstraints.height}
                        ref={webcamRef}
                        width={videoConstraints.width}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        mirrored={true}
                    />
                ) : (
                    <img src={picture}  alt='Your picture'/>
                )}
            </div>
            <div>
                {picture != '' ? (
                    <HStack>
                        <Button
                            colorScheme='red'
                            onClick={(e) => {
                                e.preventDefault()
                                setPicture('');
                                props.onReset();
                            }}
                        >
                            Retake
                        </Button>
                        <Button
                            colorScheme='whatsapp'
                            disabled={props.isSaved}
                            onClick={(e) => {
                                e.preventDefault();
                                props.onSubmit(picture)
                            }}
                        >
                            Save
                        </Button>
                    </HStack>
                ) : (
                    <Button
                        colorScheme='teal'
                        size='md'
                        onClick={(e) => {
                            e.preventDefault()
                            capture()
                        }}
                    >
                        Capture
                    </Button>
                )}
            </div>
        </>
    )
}
export default Camera