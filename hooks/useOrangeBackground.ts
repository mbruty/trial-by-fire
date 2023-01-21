import { useEffect } from 'react';

function useOrangeBackground() {
    useEffect(() => {
        document.body.classList.add('background-dark-orange');
        return () => {
            document.body.classList.remove('background-dark-orange');
        }
    }, [])
}

export default useOrangeBackground;