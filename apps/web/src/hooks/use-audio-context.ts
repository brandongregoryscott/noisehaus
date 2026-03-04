import { useContext } from "react";
import { AudioContext } from "@/contexts/audio-context";

const useAudioContext = () => useContext(AudioContext);

export { useAudioContext };
