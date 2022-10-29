export interface ArticleCategoryViewModel {
  id: number;
  name: string;
  code: string;
  companyId: number;

  appCodeId: number | null;

  dateFrom?: Date | string;
  dateTo?: Date | string | null;

  parentId?: number;
}

export const getDefaultArticleCategory = (
  companyId: number,
  nextCode?: string,
  parentId?: number
): Partial<ArticleCategoryViewModel> => {
  return {
    companyId,
    parentId,
    code: nextCode ?? '01',
  };
};

export const filter = (
  item: ArticleCategoryViewModel,
  searchQuery: string,
  languageCode?: string
): boolean => {
  return (
    // (item?.translations?.[languageCode] ?? '')
    //   ?.toLocaleLowerCase()
    //   .includes((searchQuery ?? '').toLocaleLowerCase()) ||
    item?.code
      ?.toLocaleLowerCase()
      .includes((searchQuery ?? '').toLocaleLowerCase()) ||
    item?.name
      ?.toLocaleLowerCase()
      .includes((searchQuery ?? '').toLocaleLowerCase())
  );
};

export const getUniqueIdentifier = (item: ArticleCategoryViewModel): any => {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    parentId: item.parentId,
    companyId: item.companyId,
  };
};
