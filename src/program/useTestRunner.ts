import { useCallback, useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { Rule, Sound, SpeakPhrase } from "./types";

/** A representative sentence for a talk cue, used when previewing a preset. */
function demoSpeech(phrase: SpeakPhrase): string {
  switch (phrase.kind) {
    case "pace":
      return "Your pace is 7 40 per mile";
    case "remaining":
      return "1.2 miles left";
    case "completed":
      return "2 miles completed";
    case "custom":
      return phrase.text;
  }
}

const BUZZ_ON = 250; // ms per vibration pulse
const BUZZ_OFF = 150; // ms gap between pulses
const GAP_BETWEEN_MOMENTS = 450; // ms pause between moments

/**
 * Runs a preset as a preview: walks its rules in order, exposing the
 * active rule id so the UI can highlight it, and performs each rule's
 * responses (play the trimmed sound, buzz N times) before moving on.
 */
export function useTestRunner(rules: Rule[], sounds: Sound[]) {
  const player = useAudioPlayer(undefined, { updateInterval: 200 });
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolver = useRef<(() => void) | null>(null);

  // A cancellable delay: stop() can resolve it early to end the run promptly.
  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      resolver.current = resolve;
      timer.current = setTimeout(() => {
        resolver.current = null;
        timer.current = null;
        resolve();
      }, ms);
    });
  }, []);

  const stop = useCallback(() => {
    cancelled.current = true;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (resolver.current) {
      const resolve = resolver.current;
      resolver.current = null;
      resolve();
    }
    Vibration.cancel();
    Speech.stop();
    player.pause();
    setActiveRuleId(null);
    setRunning(false);
  }, [player]);

  const performRule = useCallback(
    async (rule: Rule) => {
      for (const response of rule.responses) {
        if (cancelled.current) return;
        if (response.kind === "vibrate") {
          const times = Math.max(1, response.times);
          const pattern = [0];
          for (let i = 0; i < times; i++) {
            pattern.push(BUZZ_ON);
            if (i < times - 1) pattern.push(BUZZ_OFF);
          }
          Vibration.vibrate(pattern);
          await wait(times * BUZZ_ON + (times - 1) * BUZZ_OFF);
        } else if (response.kind === "speak") {
          const text = demoSpeech(response.phrase).trim();
          if (!text) continue;
          await new Promise<void>((resolve) => {
            Speech.speak(text, {
              onDone: () => resolve(),
              onStopped: () => resolve(),
              onError: () => resolve(),
            });
          });
        } else {
          const sound = sounds.find((s) => s.id === response.soundId);
          if (!sound) continue;
          player.replace(sound.uri);
          await player.seekTo(sound.start);
          if (cancelled.current) return;
          player.play();
          await wait(Math.max(0, sound.end - sound.start) * 1000);
          player.pause();
        }
      }
    },
    [player, sounds, wait]
  );

  const start = useCallback(async () => {
    if (rules.length === 0 || running) return;
    cancelled.current = false;
    setRunning(true);
    for (let i = 0; i < rules.length; i++) {
      if (cancelled.current) break;
      setActiveRuleId(rules[i].id);
      await performRule(rules[i]);
      if (cancelled.current) break;
      if (i < rules.length - 1) await wait(GAP_BETWEEN_MOMENTS);
    }
    if (!cancelled.current) {
      setActiveRuleId(null);
      setRunning(false);
    }
  }, [rules, running, performRule, wait]);

  // Cancel any in-flight run when the screen goes away.
  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (timer.current) clearTimeout(timer.current);
      Vibration.cancel();
    };
  }, []);

  return { activeRuleId, running, start, stop };
}
