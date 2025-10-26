import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Ana renk
    },
    secondary: {
      main: "#dc004e", // İkincil renk
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

export default theme;
