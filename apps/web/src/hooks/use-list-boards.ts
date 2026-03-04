import type { ListBoardsResponse } from "common";
import { useQuery } from "@tanstack/react-query";
import { LIST_BOARD_ROUTE } from "common";
import { get } from "@/utils/fetch";

const useListBoards = () => {
    const result = useQuery({
        queryFn: async () => {
            const response = await get<ListBoardsResponse>(LIST_BOARD_ROUTE);

            return response;
        },
        queryKey: [LIST_BOARD_ROUTE],
    });

    return result;
};

export { useListBoards };
