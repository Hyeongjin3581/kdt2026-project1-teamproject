import { createRoot } from "react-dom/client";

const root = document.querySelector( '#root')

const create = createRoot( root );

import App from "./App";
create.render(<App></App>)