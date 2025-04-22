import { Box, Button, TextField, Autocomplete, useTheme } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Formik } from "formik";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
import { tokens } from "../theme";
import { db } from "../config/firebaseConfig";
import { doc, updateDoc, Timestamp, GeoPoint, serverTimestamp } from "firebase/firestore";

const TYPE_CRIME = 0b001;    // 1
const TYPE_FIRE = 0b010;     // 2
const TYPE_MEDICAL = 0b100;  // 4
const TYPE_SUSPICIOUS = 0b1000; // 8 (for suspicion reports)

const PNPID = "Cd9EsUAQMNp3aam3K1Ze";

const DispatchReportForm = ({ users, stations, report, onClose }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    // Define station types
    const STATION_POLICE = "police";
    const STATION_FIRE = "fire";
    const STATION_DISASTER = "disaster";
    const STATION_BARANGAY = "barangay";
    
    // Initial Values
    const initialValues = {
        id: report?.id || "",
        status: 1,
        reporter: {
            name: {
                first_name: report?.reporter.name.first_name || "",
                last_name: report?.reporter.name.last_name || "",
            },
            address: {
                barangay: report?.reporter.address.barangay || "",
                municipality: report?.reporter.address.municipality || "Indang",
                province: report?.reporter.address.province || "Cavite",
            },
            user_id: report?.reporter.user_id || "",
            phone: report?.reporter.phone || "",
            birthdate: report?.reporter.birthdate 
                ? new Date(report.reporter.birthdate)
                : null,
        },
        type: report?.type || 0,
        time: {
            estimated: report?.time.estimated || 7,
        },
        flags: {
            report: report?.flags.report || null,
        },
        service: report?.service || 0,
        address: {
            barangay: report?.address.barangay || "",
            municipality: report?.address.municipality || "Indang",
            province: report?.address.province || "Cavite",
            location: {
                latitude:  report?.address?.location?.latitude || "",
                longitude: report?.address?.location?.longitude || "",
            }
        },
        date: {
            incident: report?.date.incident 
              ? report.date.incident.toDate()
              : null,
        },
        responders: {
            providers: []
        }
    };

    // Display Available Stations that provide the required types
    const getAvailableStations = (selectedType, stations) => {
        return stations.filter(station => {
            const stationType = station.station?.type || "";

            // Suspicious reports can ONLY be handled by police or barangay
            if (selectedType === TYPE_SUSPICIOUS) {
                return stationType === STATION_POLICE || stationType === STATION_BARANGAY;
            }

            // Crime is handled by police or barangay
            const handlesCrime = (selectedType & TYPE_CRIME) && 
                (stationType === STATION_POLICE || stationType === STATION_BARANGAY);

            // Fire is handled by fire stations
            const handlesFire = (selectedType & TYPE_FIRE) && stationType === STATION_FIRE;

            // Medical is handled by disaster stations
            const handlesMedical = (selectedType & TYPE_MEDICAL) && stationType === STATION_DISASTER;

            // The station is valid if it matches at least one required type
            return handlesCrime || handlesFire || handlesMedical;
        });
    };

    // Dispatch Report
    const handleDispatch = async (values) => {
        // Exclude "isAddingNewPersonnel" from values
        const { isAddingNewPersonnel, ...rest } = values;
    
        const formattedReport = {
            ...rest,
            reporter: {
                ...rest.reporter,
                birthdate: rest.reporter.birthdate instanceof Date 
                    ? rest.reporter.birthdate.toISOString().split("T")[0]
                    : rest.reporter.birthdate,
            },
            address: {
                ...rest.address,
                location: new GeoPoint(
                    rest.address.location.latitude,
                    rest.address.location.longitude
                ),
            },
            date: {
                ...rest.date,
                incident: Timestamp.fromDate(new Date(rest.date.incident)),
                received: serverTimestamp()
            },
        };
    
        console.log("Formatted Report:", formattedReport);
    
        try {
            await updateDoc(doc(db, "reports", values.id), formattedReport);
            console.log("Report dispatched successfully:", formattedReport);
            alert("Report dispatched successfully! ✅");
            onClose();
        } catch (error) {
            console.error("Error updating report:", error);
        }
    };

    const generateUserId = () => `B1${generateRandomId()}`;
    
    return (
        <Box m="20px">
            <Header title="DISPATCH REPORT" subtitle="Dispatch Report to Stations" />
            <Box mt="20px" />
            <Formik
                onSubmit={handleDispatch}
                initialValues={initialValues}
                validationSchema={false}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                            }}
                        >
                            {/* Reporter */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Reporter"
                                name="reporter.user_id"
                                value={`${values.reporter?.name.first_name} ${values.reporter?.name.last_name}`}
                                readOnly
                                sx={{
                                    gridColumn: "span 2",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                    color: "inherit",
                                    },
                                }}
                            />

                            {/* Type */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Type"
                                name="type"
                                value={getTypeLabel(values.type) || ""}
                                readOnly
                                sx={{
                                    gridColumn: "span 2",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                    color: "inherit",
                                    },
                                }}
                                error={!!touched.type && !!errors.type}
                                helperText={touched.type && errors.type}
                            />

                            {/* Service(s) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Service Requirement"
                                value={serviceOptions.find(option => option.value === values.service)?.label || ""}
                                name="service"
                                readOnly
                                sx={{
                                    gridColumn: "span 2",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                        cursor: "default",
                                    },
                                }}
                            />

                            {/* Incident Date */}
                            <DateTimePicker
                                label="Incident Date"
                                value={values.date.incident}
                                onChange={(date) => setFieldValue("date.incident", date)}
                                disableOpenPicker
                                readOnly // Ensures no typing
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: theme.palette.mode === "dark" ? "#293040" : "#c4c5c8",
                                }}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    error={!!touched.date?.incident && !!errors.date?.incident}
                                    helperText={touched.date?.incident && errors.date?.incident}
                                    readOnly
                                    sx={{
                                        gridColumn: "span 1",
                                        pointerEvents: "none", // Prevents interaction
                                        userSelect: "none", // Prevents selection
                                        caretColor: "transparent", // Hides the blinking text cursor
                                        "& .MuiInputBase-input": {
                                          cursor: "default",
                                        },
                                        "& .MuiIconButton-root": {
                                          display: "none", // Hides the date picker icon
                                        },
                                      }}
                                    />
                                )}
                            />

                            {/* Estimated Arrival Time */}
                            <TextField
                                fullWidth
                                type="number"
                                variant="filled"
                                label="Estimated Time (minutes)"
                                name="time.estimated"
                                value={values.time.estimated}
                                onChange={(e) => setFieldValue("time.estimated", Number(e.target.value))}
                                onBlur={handleBlur}
                                error={!!touched.time?.estimated && !!errors.time?.estimated}
                                helperText={touched.time?.estimated && errors.time?.estimated}
                                sx={{ gridColumn: "span 1" }}
                            />

                            {/* Service Provider */}
                            <Autocomplete
                                options={getAvailableStations(values.type, stations)}
                                getOptionLabel={(option) => option.station.name}
                                value={
                                    stations.find(
                                        (station) =>
                                            station.station.id === values.responders?.providers?.[0]?.station?.id
                                    ) || null
                                }
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        const vehicles = newValue.service?.vehicle || [];
                                        const hasFiretruck = vehicles.some((v) => v.firetruck);
                                        const hasAmbulance = vehicles.some((v) => v.ambulance);

                                        let service = 0;

                                        // Suspicious report doesn't involve vehicles
                                        if (values.type === TYPE_SUSPICIOUS) {
                                            service = 0;
                                        } else {
                                            if (hasFiretruck && hasAmbulance) {
                                                service = 3; // Both Firetruck & Ambulance
                                            } else if (hasFiretruck) {
                                                service = 1; // Firetruck only
                                            } else if (hasAmbulance) {
                                                service = 2; // Ambulance only
                                            }
                                        }

                                        setFieldValue("responders.providers", [
                                            {
                                                station: {
                                                    id: newValue.station.id,
                                                    name: newValue.station.name,
                                                    type: newValue.station.type,
                                                },
                                                service,
                                            },
                                        ]);
                                    } else {
                                        setFieldValue("responders.providers", []);
                                    }
                                }}
                                onBlur={handleBlur}
                                sx={{ gridColumn: "span 4" }}
                                renderInput={(params) => {
                                    const providerType = values.responders?.providers?.[0]?.station?.type;
                                    let label = "Select Station";

                                    // Label based on the selected report type
                                    if (values.type === TYPE_SUSPICIOUS) {
                                        label = "Suspicious Report Handler";
                                    } else if (providerType === "fire") {
                                        label = "Firetruck Provider";
                                    } else if (providerType === "disaster") {
                                        label = "Ambulance Provider";
                                    } else if (providerType === "police" || providerType === "barangay") {
                                        label = "Crime Handler";
                                    }

                                    return (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                            label={label}
                                            name="responders.providers"
                                            error={!!touched.responders?.providers && !!errors.responders?.providers}
                                            helperText={touched.responders?.providers && errors.responders?.providers}
                                        />
                                    );
                                }}
                            />

                            {/* Second Service Provider */}
                            {values?.responders?.providers?.length > 0 &&
                                ![1, 2, 4, 8].includes(values.type) && // Trigger only if combination of types
                                ((() => {
                                    const firstStation = values.responders.providers[0]?.station;
                                    let firstTypeBitmask = 0;

                                    // Map station type to bitmask
                                    if (["police", "barangay"].includes(firstStation.type)) firstTypeBitmask |= 1; // Crime
                                    if (firstStation.type === "fire") firstTypeBitmask |= 2; // Fire
                                    if (firstStation.type === "disaster") firstTypeBitmask |= 4; // Medical

                                    return (firstTypeBitmask !== values.type); // Show if first provider doesn't cover all required types
                                })()) && (
                                    <Autocomplete
                                        options={getAvailableStations(
                                            (() => {
                                                const firstStation = values.responders.providers[0]?.station;
                                                let firstTypeBitmask = 0;
                            
                                                // Map station type to bitmask
                                                if (["police", "barangay"].includes(firstStation.type)) firstTypeBitmask |= 1;
                                                if (firstStation.type === "fire") firstTypeBitmask |= 2;
                                                if (firstStation.type === "disaster") firstTypeBitmask |= 4;
                            
                                                // Find missing bit by XORing required type with provided type
                                                const missingType = values.type & ~firstTypeBitmask;
                                                return missingType;
                                            })(), // Missing type to find
                                            stations.filter(
                                                (station) => !values.responders.providers.some((p) => p.station.id === station.station.id)
                                            )
                                        )}
                                        getOptionLabel={(option) => option.station.name}
                                        value={
                                            stations.find(
                                                (station) => station.station.id === values.responders?.providers?.[1]?.station?.id
                                            ) || null
                                        }
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                let service = 0;
                                                if (["police", "barangay"].includes(newValue.station.type)) service = 0; // Crime
                                                if (newValue.station.type === "fire") service = 1; // Firetruck
                                                if (newValue.station.type === "disaster") service = 2; // Ambulance
                                                if (newValue.station.type === "fire_disaster") service = 3; // Both firetruck & ambulance
                            
                                                setFieldValue("responders.providers", [
                                                    ...values.responders.providers,
                                                    {
                                                        station: {
                                                            id: newValue.station.id,
                                                            name: newValue.station.name,
                                                            type: newValue.station.type,
                                                        },
                                                        service,
                                                    },
                                                ]);
                                            } else {
                                                setFieldValue("responders.providers", [
                                                    values.responders.providers[0],
                                                ]);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        sx={{ gridColumn: "span 4" }}
                                        renderInput={(params) => {
                                            // Determine the missing service before the second provider is selected
                                            const missingType = (() => {
                                                let combinedBitmask = 0;
                                                values.responders.providers.forEach((provider) => {
                                                    const type = provider.station.type;
                                                    if (["police", "barangay"].includes(type)) combinedBitmask |= 1; // Crime
                                                    if (type === "fire") combinedBitmask |= 2;                      // Fire
                                                    if (type === "disaster") combinedBitmask |= 4;                  // Medical
                                                });
                                                return values.type & ~combinedBitmask; // Missing service bitmask
                                            })();
                                        
                                            // Get the second station type (after selection)
                                            const secondStationType = values.responders.providers[1]?.station?.type;
                                        
                                            // Set appropriate label dynamically
                                            let label = "Select Station";
                                        
                                            // Show missing service label before selection
                                            if (!secondStationType) {
                                                if (missingType === 1) label = "Crime Handler";                  // Crime missing
                                                else if (missingType === 2) label = "Firetruck Provider";        // Fire missing
                                                else if (missingType === 4) label = "Ambulance Provider";        // Medical missing
                                                else if (missingType === 3) label = "Crime Handler or Firetruck Provider";    // Fire & Medical missing
                                                else if (missingType === 5) label = "Crime Handler or Ambulance Provider";    // Crime & Fire missing
                                                else if (missingType === 6) label = "Firetruck Provider or Ambulance Provider";        // Crime & Medical missing
                                            } 
                                            // Reflect the second station type label after selection
                                            else {
                                                if (["police", "barangay"].includes(secondStationType)) label = "Crime Handler";
                                                else if (secondStationType === "fire") label = "Firetruck Provider";
                                                else if (secondStationType === "disaster") label = "Ambulance Provider";
                                            }
                                        
                                            return (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    variant="filled"
                                                    label={label}
                                                    name="responders.providers[1]"
                                                    error={!!touched.responders?.providers && !!errors.responders?.providers?.[1]}
                                                    helperText={touched.responders?.providers && errors.responders?.providers?.[1]}
                                                />
                                            );
                                        }}                                        
                                    />
                            )}

                            {/* Third Service Provider */}
                            {values?.type === 7 && // Only show for combined type (Crime, Fire & Medical)
                            values.responders.providers[0]?.station && // Ensure first station is selected
                            values.responders.providers[1]?.station && // Ensure second station is selected
                            (
                                    <Autocomplete
                                        options={getAvailableStations(
                                            (() => {
                                                let combinedBitmask = 0;
                                                values.responders.providers.forEach((provider) => {
                                                    const type = provider.station.type;
                                                    if (["police", "barangay"].includes(type)) combinedBitmask |= 1;
                                                    if (type === "fire") combinedBitmask |= 2;
                                                    if (type === "disaster") combinedBitmask |= 4;
                                                });
                                                // Find missing bit by XORing required type with provided types
                                                const missingType = 7 & ~combinedBitmask;
                                                return missingType;
                                            })(),
                                            stations.filter(
                                                (station) => !values.responders.providers.some((p) => p.station.id === station.station.id)
                                            )
                                        )}
                                        getOptionLabel={(option) => option.station.name}
                                        value={
                                            stations.find(
                                                (station) => station.station.id === values.responders?.providers?.[2]?.station?.id
                                            ) || null
                                        }
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                let service = 0;
                                                if (["police", "barangay"].includes(newValue.station.type)) service = 0; // Crime
                                                if (newValue.station.type === "fire") service = 1; // Firetruck
                                                if (newValue.station.type === "disaster") service = 2; // Ambulance
                                                if (newValue.station.type === "fire_disaster") service = 3; // Both

                                                setFieldValue("responders.providers", [
                                                    ...values.responders.providers,
                                                    {
                                                        station: {
                                                            id: newValue.station.id,
                                                            name: newValue.station.name,
                                                            type: newValue.station.type,
                                                        },
                                                        service,
                                                    },
                                                ]);
                                            } else {
                                                setFieldValue("responders.providers", [
                                                    values.responders.providers[0],
                                                    values.responders.providers[1],
                                                ]);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        sx={{ gridColumn: "span 4" }}
                                        renderInput={(params) => {
                                            // Check if third provider is selected
                                            const thirdStationType = values.responders.providers[2]?.station?.type;
                                        
                                            // Determine missing type before third provider is selected
                                            const missingType = (() => {
                                                let combinedBitmask = 0;
                                                values.responders.providers.forEach((provider) => {
                                                    const type = provider.station.type;
                                                    if (["police", "barangay"].includes(type)) combinedBitmask |= 1; // Crime
                                                    if (type === "fire") combinedBitmask |= 2;                      // Fire
                                                    if (type === "disaster") combinedBitmask |= 4;                  // Medical
                                                });
                                                return 7 & ~combinedBitmask; // Missing service bitmask
                                            })();
                                        
                                            // Determine the appropriate label
                                            let label = "Select Station";
                                        
                                            if (thirdStationType) {
                                                // If third station is selected, show its corresponding label
                                                if (["police", "barangay"].includes(thirdStationType)) label = "Crime Handler";
                                                else if (thirdStationType === "fire") label = "Firetruck Provider";
                                                else if (thirdStationType === "disaster") label = "Ambulance Provider";
                                            } else {
                                                // Show missing service before selection
                                                if (missingType === 1) label = "Crime Handler";
                                                else if (missingType === 2) label = "Firetruck Provider";
                                                else if (missingType === 4) label = "Ambulance Provider";
                                            }
                                        
                                            return (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    variant="filled"
                                                    label={label}
                                                    name="responders.providers[2]"
                                                    error={!!touched.responders?.providers && !!errors.responders?.providers?.[2]}
                                                    helperText={touched.responders?.providers && errors.responders?.providers?.[2]}
                                                />
                                            );
                                        }}                                        
                                    />
                            )}

                            {/* Responder Personnel */}
                            {values.responders?.providers?.some(
                                (provider) => provider.station.id === PNPID
                            ) && (
                                <>
                                    <Autocomplete
                                        options={[
                                            ...users.filter(user => user.station?.id === PNPID),
                                            { user_id: "new", name: { first_name: "Add", last_name: "New Personnel" } }
                                        ]}
                                        getOptionLabel={(option) => 
                                            option.user_id === "new"
                                                ? "Add New Personnel"
                                                : `${option.name.first_name} ${option.name.last_name}`
                                        }
                                        value={
                                            users.find(user => user.user_id === values.responders?.providers?.find(
                                                provider => provider.station.id === PNPID
                                            )?.personnel?.user_id) || (values.isAddingNewPersonnel ? { user_id: "new" } : null)
                                        }
                                        onChange={(event, newValue) => {
                                            if (newValue?.user_id === "new") {
                                                setFieldValue("isAddingNewPersonnel", true);
                                                setFieldValue("responders.providers", values.responders.providers.map(provider => {
                                                    if (provider.station.id === PNPID) {
                                                        return {
                                                            ...provider,
                                                            personnel: {
                                                                name: { first_name: "", last_name: "" },
                                                                phone: "",
                                                                user_id: generateUserId()
                                                            }
                                                        };
                                                    }
                                                    return provider;
                                                }));
                                            } else if (newValue) {
                                                setFieldValue("isAddingNewPersonnel", false);
                                                setFieldValue("responders.providers", values.responders.providers.map(provider => {
                                                    if (provider.station.id === PNPID) {
                                                        return {
                                                            ...provider,
                                                            personnel: {
                                                                name: newValue.name,
                                                                phone: newValue.phone,
                                                                user_id: newValue.user_id,
                                                            }
                                                        };
                                                    }
                                                    return provider;
                                                }));
                                            } else {
                                                // Reset if nothing is selected
                                                setFieldValue("isAddingNewPersonnel", false);
                                                setFieldValue("responders.providers", values.responders.providers.map(provider => {
                                                    if (provider.station.id === PNPID) {
                                                        return { ...provider, personnel: { name: { first_name: "", last_name: "" }, phone: "", user_id: "" } };
                                                    }
                                                    return provider;
                                                }));
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        sx={{ gridColumn: "span 4" }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                variant="filled"
                                                label="Select Personnel"
                                                name="responders.providers.personnel.user_id"
                                                error={!!touched.responders?.providers && !!errors.responders?.providers}
                                                helperText={touched.responders?.providers && errors.responders?.providers}
                                            />
                                        )}
                                    />

                                    {/* Manual Input if Adding New Personnel */}
                                    {values.isAddingNewPersonnel && (
                                        <>
                                            {/* First Name */}
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                label="First Name"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={values.responders.providers.find(provider => provider.station.id === PNPID)?.personnel.name.first_name || ""}
                                                name={`responders.providers.${values.responders.providers.findIndex(provider => provider.station.id === PNPID)}.personnel.name.first_name`}
                                                error={!!touched.name?.first_name && !!errors.name?.first_name}
                                                helperText={touched.name?.first_name && errors.name?.first_name}
                                                sx={{ gridColumn: "span 2" }}
                                            />

                                            {/* Last Name */}
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                label="Last Name"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={values.responders.providers.find(provider => provider.station.id === PNPID)?.personnel.name.last_name || ""}
                                                name={`responders.providers.${values.responders.providers.findIndex(provider => provider.station.id === PNPID)}.personnel.name.last_name`}
                                                error={!!touched.name?.last_name && !!errors.name?.last_name}
                                                helperText={touched.name?.last_name && errors.name?.last_name}
                                                sx={{ gridColumn: "span 2" }}
                                            />

                                            {/* Phone */}
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                label="Phone"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={values.responders.providers.find(provider => provider.station.id === PNPID)?.personnel.phone || ""}
                                                name={`responders.providers.${values.responders.providers.findIndex(provider => provider.station.id === PNPID)}.personnel.phone`}
                                                error={!!touched.phone && !!errors.phone}
                                                helperText={touched.phone && errors.phone}
                                                sx={{ gridColumn: "span 4" }}
                                                inputMode="numeric"
                                                type="tel"
                                            />

                                            {/* User ID */}
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                label="User ID"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                value={values.responders.providers.find(provider => provider.station.id === PNPID)?.personnel.user_id || ""}
                                                name={`responders.providers.${values.responders.providers.findIndex(provider => provider.station.id === PNPID)}.personnel.user_id`}
                                                error={!!touched.responders?.providers?.[PNPID]?.personnel?.user_id && !!errors.responders?.providers?.[PNPID]?.personnel?.user_id}
                                                helperText={touched.responders?.providers?.[PNPID]?.personnel?.user_id && errors.responders?.providers?.[PNPID]?.personnel?.user_id}
                                                sx={{ gridColumn: "span 4" }}
                                                InputProps={{
                                                    readOnly: true,
                                                    endAdornment: (
                                                        <Button 
                                                            variant="outlined" 
                                                            onClick={() => {
                                                                const index = values.responders.providers.findIndex(provider => provider.station.id === PNPID);
                                                                setFieldValue(`responders.providers.${index}.personnel.user_id`, generateUserId());
                                                            }}
                                                            sx={{ ml: 1, color: colors.grey[900], backgroundColor: colors.greenAccent[400] }}
                                                        >
                                                            Generate
                                                        </Button>
                                                    ),
                                                }}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSubmit()} color="secondary" variant="contained">
                                Dispatch
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
};

// Validation Schema
/* const dispatchReportSchema = yup.object().shape({
    reporter: yup.object().shape({
        name: yup.object().shape({
            first_name: yup.string().required("First name is required"),
            last_name: yup.string().required("Last name is required"),
        }),
        address: yup.object().shape({
            barangay: yup.string().required("Barangay is required"),
            municipality: yup.string().required("Municipality is required"),
            province: yup.string().required("Province is required"),
        }),
        user_id: yup.string().required("User ID is required"),
        phone: yup
            .string()
            .matches(/^[0-9]{11}$/, "Phone number must be 11 digits")
            .required("Phone number is required"),
        birthdate: yup
            .date()
            .nullable()
            .required("Birthdate is required"),
    }),
    status: yup.string().required("Status is required"),
    service: yup
        .number()
        .oneOf([0, 1, 2, 3], "Invalid service type")
        .required("Service is required"),
    address: yup.object().shape({
        barangay: yup.string().required("Barangay is required"),
        location: yup.object().shape({
            latitude: yup
                .number()
                .typeError("Latitude must be a number")
                .required("Latitude is required"),
            longitude: yup
                .number()
                .typeError("Longitude must be a number")
                .required("Longitude is required"),
        }),
    }),
    date: yup.object().shape({
        incident: yup.date().nullable().required("Incident date is required"),
    }),
}); */

// Services Options
const serviceOptions = [
    { label: "None", value: 0 },
    { label: "Firetruck", value: 1 },
    { label: "Ambulance", value: 2 },
    { label: "Firetruck & Ambulance", value: 3 }
];

// Translate Type
const getTypeLabel = (bitmask) => {
    let types = [];
  
    if (bitmask & TYPE_CRIME) types.push("Crime");
    if (bitmask & TYPE_FIRE) types.push("Fire");
    if (bitmask & TYPE_MEDICAL) types.push("Medical");
    if (bitmask & TYPE_SUSPICIOUS) types.push("Suspicious Activity");
  
    if (types.length === 0) return "Unknown";
    if (types.length === 1) return types[0];
    if (types.length === 2) return types.join(" & ");
  
    return types.slice(0, -1).join(", ") + " & " + types[types.length - 1];
};

const generateRandomId = () => {
    const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    let randomString = "";
  
    // Ensure the first character after the role ID is uppercase
    randomString += uppercaseLetters.charAt(Math.floor(Math.random() * uppercaseLetters.length));
  
    // Generate the remaining 17 characters randomly
    for (let i = 1; i < 18; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    return randomString;
};

export default DispatchReportForm;