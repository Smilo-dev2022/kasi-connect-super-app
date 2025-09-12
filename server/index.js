import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes.auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLiteStore = SQLiteStoreFactory(session);

const app = express();

app.use(cors({
	origin: ["http://localhost:8080", "http://127.0.0.1:8080", "http://[::1]:8080"],
	credentials: true,
}));

app.use(express.json());

app.use(
	session({
		store: new SQLiteStore({
			dir: path.join(__dirname, "./data"),
			db: "sessions.sqlite",
		}),
		secret: process.env.SESSION_SECRET || "dev_secret_change_me",
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
			maxAge: 1000 * 60 * 60 * 24 * 7,
		},
	})
);

app.get("/api/health", (_req, res) => {
	res.json({ ok: true });
});

app.use("/api/auth", authRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
	console.log(`Auth server listening on http://localhost:${port}`);
});

