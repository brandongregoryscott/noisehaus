import { ErrorDisplay } from "@/components/error-display";

const NotFoundPage: React.FC = () => {
    return (
        <ErrorDisplay
            message="The page you requested is invalid or no longer exists."
            name="Not Found"
        />
    );
};

export { NotFoundPage };
