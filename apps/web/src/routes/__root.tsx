import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { isNotFoundError } from "common";
import { NotFoundPage } from "@/components/not-found-page";
import { ToastContextProvider, Toast } from "@/components/toast";
import { AudioContextProvider } from "@/contexts/audio-context";
import { CreateContextProvider } from "@/contexts/create-context";
import { ApplicationLayout } from "@/layouts/application-layout";
import { globalStyles } from "@/utils/theme";
import "@/css/reset.css";
import "@/css/global.css";

globalStyles();

const client = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (_failureCount, error) => {
                if (isNotFoundError(error)) {
                    return false;
                }

                return true;
            },
        },
    },
});

const RootComponent: React.FC = () => {
    return (
        <QueryClientProvider client={client}>
            <ToastContextProvider>
                <Toast.Provider>
                    <CreateContextProvider>
                        <AudioContextProvider>
                            <ApplicationLayout>
                                <Outlet />
                            </ApplicationLayout>
                        </AudioContextProvider>
                    </CreateContextProvider>
                </Toast.Provider>
            </ToastContextProvider>
        </QueryClientProvider>
    );
};

const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: NotFoundPage,
});

export { Route };
