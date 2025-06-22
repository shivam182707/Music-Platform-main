import {createContext} from "react";

const songContext = createContext({
    currentSong: null,
    setCurrentSong: () => {},
    soundPlayed: null,
    setSoundPlayed: () => {},
    isPaused: true,
    setIsPaused: () => {},
    currentPlaylist: [],
    setCurrentPlaylist: () => {},
    currentIndex: -1,
    setCurrentIndex: () => {},
    isChangingSong: false,
    setIsChangingSong: () => {}
});

export default songContext;
