/**
 * @preserve
 * Authors: Júlio C. Zuppa
 * Last updated: Jan 12, 2018
 *
 * Description: Definition file for Portuguese - Brazil language-country.
 */
import * as C from '../constants';

const dictionary = {
  languageCode: 'pt-BR',
  [C.CONTEXTMENU_ITEMS_ROW_ABOVE]: 'Inserir linha acima',
  [C.CONTEXTMENU_ITEMS_ROW_BELOW]: 'Inserir linha abaixo',
  [C.CONTEXTMENU_ITEMS_INSERT_LEFT]: 'Inserir coluna esquerda',
  [C.CONTEXTMENU_ITEMS_INSERT_RIGHT]: 'Inserir coluna direita',
  [C.CONTEXTMENU_ITEMS_REMOVE_ROW]: ['Excluir linha', 'Excluir linhas'],
  [C.CONTEXTMENU_ITEMS_REMOVE_COLUMN]: ['Excluir coluna', 'Excluir colunas'],
  [C.CONTEXTMENU_ITEMS_UNDO]: 'Desfazer',
  [C.CONTEXTMENU_ITEMS_REDO]: 'Refazer',
  [C.CONTEXTMENU_ITEMS_READ_ONLY]: 'Somente leitura',
  [C.CONTEXTMENU_ITEMS_CLEAR_COLUMN]: 'Limpar coluna',

  [C.CONTEXTMENU_ITEMS_ALIGNMENT]: 'Alinhamento',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT]: 'Esquerda',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER]: 'Centralizado',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT]: 'Direita',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY]: 'Justificado',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE]: 'Meio',
  [C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM]: 'Inferior',

  [C.CONTEXTMENU_ITEMS_FREEZE_COLUMN]: 'Congelar coluna',
  [C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN]: 'Descongelar coluna',

  [C.CONTEXTMENU_ITEMS_BORDERS]: 'Bordas',
  [C.CONTEXTMENU_ITEMS_BORDERS_TOP]: 'Superior',
  [C.CONTEXTMENU_ITEMS_BORDERS_RIGHT]: 'Direita',
  [C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM]: 'Inferior',
  [C.CONTEXTMENU_ITEMS_BORDERS_LEFT]: 'Esquerda',
  [C.CONTEXTMENU_ITEMS_REMOVE_BORDERS]: 'Excluir bordas(s)',

  [C.CONTEXTMENU_ITEMS_ADD_COMMENT]: 'Incluir comentário',
  [C.CONTEXTMENU_ITEMS_EDIT_COMMENT]: 'Editar comentário',
  [C.CONTEXTMENU_ITEMS_REMOVE_COMMENT]: 'Remover comentário',
  [C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT]: 'Comentário somente leitura',

  [C.CONTEXTMENU_ITEMS_MERGE_CELLS]: 'Mesclar células',
  [C.CONTEXTMENU_ITEMS_UNMERGE_CELLS]: 'Desfazer mesclagem de células',

  [C.CONTEXTMENU_ITEMS_COPY]: 'Copiar',
  [C.CONTEXTMENU_ITEMS_CUT]: 'Recortar',

  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD]: 'Inserir linha filha',
  [C.CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD]: 'Desanexar da linha pai',

  [C.CONTEXTMENU_ITEMS_HIDE_COLUMN]: ['Ocultar coluna', 'Ocultar colunas'],
  [C.CONTEXTMENU_ITEMS_SHOW_COLUMN]: ['Exibir coluna', 'Exibir colunas'],

  [C.CONTEXTMENU_ITEMS_HIDE_ROW]: ['Ocultar linha', 'Ocultar linhas'],
  [C.CONTEXTMENU_ITEMS_SHOW_ROW]: ['Exibir linha', 'Exibir linhas'],

  [C.FILTERS_CONDITIONS_NONE]: 'Nenhum',
  [C.FILTERS_CONDITIONS_EMPTY]: 'É vazio',
  [C.FILTERS_CONDITIONS_NOT_EMPTY]: 'Não é vazio',
  [C.FILTERS_CONDITIONS_EQUAL]: 'É igual a',
  [C.FILTERS_CONDITIONS_NOT_EQUAL]: 'É diferente de',
  [C.FILTERS_CONDITIONS_BEGINS_WITH]: 'Começa com',
  [C.FILTERS_CONDITIONS_ENDS_WITH]: 'Termina com',
  [C.FILTERS_CONDITIONS_CONTAINS]: 'Contém',
  [C.FILTERS_CONDITIONS_NOT_CONTAIN]: 'Não contém',
  [C.FILTERS_CONDITIONS_GREATER_THAN]: 'Maior que',
  [C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL]: 'Maior ou igual a',
  [C.FILTERS_CONDITIONS_LESS_THAN]: 'Menor que',
  [C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL]: 'Maior ou igual a',
  [C.FILTERS_CONDITIONS_BETWEEN]: 'Está entre',
  [C.FILTERS_CONDITIONS_NOT_BETWEEN]: 'Não está entre',
  [C.FILTERS_CONDITIONS_AFTER]: 'Depois',
  [C.FILTERS_CONDITIONS_BEFORE]: 'Antes',
  [C.FILTERS_CONDITIONS_TODAY]: 'Hoje',
  [C.FILTERS_CONDITIONS_TOMORROW]: 'Amanhã',
  [C.FILTERS_CONDITIONS_YESTERDAY]: 'Ontem',

  [C.FILTERS_VALUES_BLANK_CELLS]: 'Células vazias',

  [C.FILTERS_DIVS_FILTER_BY_CONDITION]: 'Filtrar por condição',
  [C.FILTERS_DIVS_FILTER_BY_VALUE]: 'Filtrar por valor',

  [C.FILTERS_LABELS_CONJUNCTION]: 'E',
  [C.FILTERS_LABELS_DISJUNCTION]: 'Ou',

  [C.FILTERS_BUTTONS_SELECT_ALL]: 'Selecionar tudo',
  [C.FILTERS_BUTTONS_CLEAR]: 'Limpar',
  [C.FILTERS_BUTTONS_OK]: 'OK',
  [C.FILTERS_BUTTONS_CANCEL]: 'Cancelar',

  [C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH]: 'Localizar',
  [C.FILTERS_BUTTONS_PLACEHOLDER_VALUE]: 'Valor',
  [C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE]: 'Segundo valor',

  [C.PAGINATION_SECTION]: 'Paginação',
  [C.PAGINATION_PAGE_SIZE_SECTION]: 'Linhas por página',
  [C.PAGINATION_PAGE_SIZE_AUTO]: 'Auto',
  [C.PAGINATION_COUNTER_SECTION]: '[start] - [end] de [total]',
  [C.PAGINATION_NAV_SECTION]: 'Página [currentPage] de [totalPages]',
  [C.PAGINATION_FIRST_PAGE]: 'Ir para a primeira página',
  [C.PAGINATION_PREV_PAGE]: 'Ir para a página anterior',
  [C.PAGINATION_NEXT_PAGE]: 'Ir para a próxima página',
  [C.PAGINATION_LAST_PAGE]: 'Ir para a última página',
};

export default dictionary;
