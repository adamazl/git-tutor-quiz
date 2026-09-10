export type DiagramKind =
  | "init"
  | "staging"
  | "commit"
  | "branch"
  | "checkout"
  | "mergeFastForward"
  | "mergeThreeWay"
  | "remoteClone"
  | "remotePush"
  | "remotePull";
