import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material";
//import { light } from "@mui/material/styles/createPalette";

// Color Design Tokens
export const tokens = (mode) => ({
    ...(mode === 'dark'
        ? {
            grey: {
                100: "#e0e0e0",
                200: "#c2c2c2",
                300: "#a3a3a3",
                400: "#858585",
                500: "#666666",
                600: "#525252",
                700: "#3d3d3d",
                800: "#292929",
                900: "#141414"
            },
            primary: {
                100: "#d0d1d5",
                200: "#a1a4ab",
                300: "#727681",
                400: "#1F2A40",
                500: "#141b2d",
                600: "#101624",
                700: "#0c101b",
                800: "#080b12",
                900: "#040509"
            },
            greenAccent: {
                100: "#fff3de",
                200: "#ffe8bd",
                300: "#ffdc9c",
                400: "#ffd17b",
                500: "#ffc55a",
                600: "#cc9e48",
                700: "#997636",
                800: "#664f24",
                900: "#332712"
            },
            redAccent: {
                100: "#fed9cc",
                200: "#feb399",
                300: "#fd8d66",
                400: "#fd6733",
                500: "#fc4100",
                600: "#ca3400",
                700: "#972700",
                800: "#651a00",
                900: "#320d00"
            },
            blueAccent: {
                100: "#d5dce6",
                200: "#abb8cc",
                300: "#8095b3",
                400: "#567199",
                500: "#2c4e80",
                600: "#233e66",
                700: "#1a2f4d",
                800: "#121f33",
                900: "#09101a"
            }
        } : {
            grey: {
                100: "#141414",
                200: "#292929",
                300: "#3d3d3d",
                400: "#525252",
                500: "#666666",
                600: "#858585",
                700: "#a3a3a3",
                800: "#c2c2c2",
                900: "#e0e0e0",
            },
            primary: {
                100: "#040509",
                200: "#080b12",
                300: "#0c101b",
                400: "#f2f0f0",
                500: "#141b2d",
                600: "#434957",
                700: "#727681",
                800: "#a1a4ab",
                900: "#d0d1d5",
            },
            greenAccent: {
                100: "#332712",
                200: "#664f24",
                300: "#997636",
                400: "#cc9e48",
                500: "#ffc55a",
                600: "#ffd17b",
                700: "#ffdc9c",
                800: "#ffe8bd",
                900: "#fff3de"
            },
            redAccent: {
                100: "#320d00",
                200: "#651a00",
                300: "#972700",
                400: "#ca3400",
                500: "#fc4100",
                600: "#fd6733",
                700: "#fd8d66",
                800: "#feb399",
                900: "#fed9cc"
            },
            blueAccent: {
                100: "#09101a",
                200: "#121f33",
                300: "#1a2f4d",
                400: "#233e66",
                500: "#2c4e80",
                600: "#567199",
                700: "#8095b3",
                800: "#abb8cc",
                900: "#d5dce6"
            },
        }
    )
});

// mui Theme Settings
export const themeSettings = (mode) => {
    const colors = tokens(mode);

    return {
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    primary : {
                        main: colors.primary[500],
                    },
                    secondary: {
                        main: colors.greenAccent[500],
                    },
                    neutral: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[100]
                    },
                    background: {
                        default: colors.primary[500],
                    }
                } : {
                    primary : {
                        main: colors.primary[100],
                    },
                    secondary: {
                        main: colors.greenAccent[500],
                    },
                    neutral: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[100]
                    },
                    background: {
                        default: "#fcfcfc",
                    }
                })
        },
        typography: {
            fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
            fontSize: 12,
            h1: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 40,
            },
            h2: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 32,
            },
            h3: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 24,
            },
            h4: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 20,
            },
            h5: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 16,
            },
            h6: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 14,
            },
            h7: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 13,
            }
        }
    }
};

// Context for Color Mode
export const ColorModeContext = createContext({
    toggleColorMode: () => {}
});

export const useMode = () => {
    const [mode, setMode] = useState('dark');

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => 
                setMode((prev) => (prev === "light" ? "dark" : "light")),
        }),
        []
    );

    const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

    return [theme, colorMode]
};