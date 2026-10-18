import type { Board } from "common";
import { useQuery } from "@tanstack/react-query";
import { LIST_BOARD_ROUTE } from "common";
import { get } from "@/utils/fetch";
import { toQueryPromise } from "@/utils/query-result";

const useListBoards = () => {
    const result = useQuery({
        queryFn: async () => {
            return toQueryPromise(get<Board[]>(LIST_BOARD_ROUTE));
        },
        queryKey: [LIST_BOARD_ROUTE],
    });

    return result;
};

export { useListBoards };
