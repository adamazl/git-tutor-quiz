import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Firebase must never be hit for real during tests. Individual test files
// may override these with more specific behavior via their own vi.mock calls.
class MockFirebaseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "FirebaseError";
    this.code = code;
  }
}

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  FirebaseError: MockFirebaseError,
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: null) => void) => {
    callback(null);
    return () => {};
  }),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  setDoc: vi.fn(async () => undefined),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
