import { Alert } from "react-native";

/**
 * Standard "this can't be undone" confirmation shown before any delete.
 * `noun` names what's being removed, e.g. "sound", "preset", "run".
 */
export function confirmDelete(noun: string, onConfirm: () => void) {
  Alert.alert(`Delete ${noun}?`, `Deleting this ${noun} cannot be undone. Proceed?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}
