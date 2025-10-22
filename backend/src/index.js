import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import methodOverride from "method-override";
import path from "path";

import { fileURLToPath } from "url";

// import userRouter from "./API/v1/routes/routes.js"
import apiRoutes from "./API/v1/routes/index.js";



// const route = require('./routes');
import db from './config/db/index.js'

// Connect to DB
db.connect();

const app = express();
const port = 8888;

// Use static folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
    express.urlencoded({
        extended: true,
    }), 
);
app.use(express.json());

app.use(methodOverride('_method'));

// HTTP logger
// app.use(morgan('combined'));

app.use(cors());

// router init
app.use("/api", apiRoutes);

app.listen(port, () =>
    console.log(`App listening at http://localhost:${port}`),
);
