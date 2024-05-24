import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { EventBus } from './game/EventBus';
import './App.css';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {}

    const [nextWaveDisabled, setNextWaveDisabled] = useState(false);

    const [wave, setWave] = useState(1);

    const nextWave = () => {
        EventBus.emit('next-wave')
        setNextWaveDisabled(true);
        setWave(wave + 1);
    }

    EventBus.on('wave-complete', () => {
        setNextWaveDisabled(false)
    })

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            <div id="menu">
                <button onClick={nextWave} disabled={nextWaveDisabled}>Next Wave</button>
            </div>
        </div>
    )
}

export default App
