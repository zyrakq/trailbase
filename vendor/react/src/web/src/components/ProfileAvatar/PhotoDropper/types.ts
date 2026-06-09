export type PhotoDropperProps = {
  open: boolean;
  close: () => void;
  submit: () => Promise<void>;
};

export interface PhotoDropperManager {
  opened: boolean;
  open: () => void;
  close: () => void;
  submit: () => Promise<void>;
}
