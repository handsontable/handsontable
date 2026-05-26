<?php

namespace App\Repository;

use App\Entity\Product;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class ProductRepository extends ServiceEntityRepository
{
    // Columns that may appear in filter and sort parameters.
    // Validated before use in any query to prevent SQL injection.
    private const ALLOWED_COLUMNS = ['name', 'sku', 'category', 'price', 'stock'];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Product::class);
    }

    // Returns paginated products + total count for the given filters and sort.
    // Called by ProductController::index().
    public function findPage(int $page, int $pageSize, array $sort, array $filters): array
    {
        $qb = $this->buildFilteredQuery($filters);

        // Clone the builder before adding ORDER BY / LIMIT so the COUNT query
        // counts all filtered rows, not just the current page.
        $total = (int) (clone $qb)
            ->select('COUNT(p.id)')
            ->getQuery()
            ->getSingleScalarResult();

        if (!empty($sort['prop']) && in_array($sort['prop'], self::ALLOWED_COLUMNS, true)) {
            $direction = in_array(strtolower($sort['order'] ?? ''), ['asc', 'desc'])
                ? strtolower($sort['order'])
                : 'asc';
            $qb->orderBy("p.{$sort['prop']}", $direction);
        } else {
            // Default: preserve insertion order via sort_order column.
            $qb->orderBy('p.sortOrder', 'asc');
        }

        $products = $qb
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();

        return ['products' => $products, 'total' => $total];
    }

    /** @return Product[] */
    public function createBlankRows(int $count, string $position = 'below', ?int $referenceRowId = null): array
    {
        $em      = $this->getEntityManager();
        $created = [];

        $em->wrapInTransaction(function () use ($em, $count, $position, $referenceRowId, &$created) {
            $insertAt = $this->resolveInsertOrder($referenceRowId, $position, $count);

            for ($i = 0; $i < $count; $i++) {
                $product = (new Product())
                    ->setName('')
                    ->setSku('NEW-' . strtoupper(bin2hex(random_bytes(3))))
                    ->setCategory('Electronics')
                    ->setPrice(0)
                    ->setStock(0)
                    ->setSortOrder($insertAt + $i);

                $em->persist($product);
                $created[] = $product;
            }

            $em->flush();
        });

        return $created;
    }

    // Determines the sortOrder for the new row(s) and shifts existing rows to make room.
    private function resolveInsertOrder(?int $referenceRowId, string $position, int $count): int
    {
        if ($referenceRowId !== null) {
            $ref = $this->find($referenceRowId);
            if ($ref) {
                $insertAt = $position === 'above'
                    ? $ref->getSortOrder()
                    : $ref->getSortOrder() + 1;

                // Shift rows at or after insertAt to make room for the new rows.
                $this->createQueryBuilder('p')
                    ->update()
                    ->set('p.sortOrder', 'p.sortOrder + :count')
                    ->where('p.sortOrder >= :insertAt')
                    ->setParameter('count', $count)
                    ->setParameter('insertAt', $insertAt)
                    ->getQuery()
                    ->execute();

                return $insertAt;
            }
        }

        // No reference row — append after the current maximum.
        $max = $this->createQueryBuilder('p')
            ->select('MAX(p.sortOrder)')
            ->getQuery()
            ->getSingleScalarResult();

        return (int) ($max ?? 0) + 1;
    }

    // Body: [{ id, changes: { name?, price?, ... } }, ...]
    public function updateRows(array $rows): void
    {
        $em = $this->getEntityManager();

        foreach ($rows as $row) {
            $product = $this->find($row['id'] ?? null);
            if (!$product) {
                continue;
            }

            $changes = $row['changes'] ?? [];
            unset($changes['id']);

            foreach ($changes as $field => $value) {
                if (!in_array($field, self::ALLOWED_COLUMNS, true)) {
                    continue;
                }
                $setter = 'set' . ucfirst($field);
                if (method_exists($product, $setter)) {
                    $product->$setter($value);
                }
            }
        }

        $em->flush();
    }

    // Body: [1, 4, 7]
    public function deleteByIds(array $ids): void
    {
        if (empty($ids)) {
            return;
        }

        $this->createQueryBuilder('p')
            ->delete()
            ->where('p.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->execute();
    }

    private function buildFilteredQuery(array $filters): QueryBuilder
    {
        $qb = $this->createQueryBuilder('p');
        $i  = 0;

        foreach ($filters as $filter) {
            $prop      = $filter['prop']      ?? null;
            $condition = $filter['condition'] ?? null;
            $value     = $filter['value']     ?? null;
            $value2    = $filter['value2']    ?? null;

            // Validate $prop before interpolating it into DQL to prevent injection.
            if (!$prop || !$condition || !in_array($prop, self::ALLOWED_COLUMNS, true)) {
                continue;
            }

            $p  = "v{$i}";
            $p2 = "v2{$i}";
            $i++;

            switch ($condition) {
                // Text conditions — use LOWER() for case-insensitive matching.
                case 'contains':
                    $qb->andWhere("LOWER(p.{$prop}) LIKE :{$p}")
                       ->setParameter($p, '%' . $this->escapeLike(strtolower((string) $value)) . '%');
                    break;
                case 'not_contains':
                    $qb->andWhere("LOWER(p.{$prop}) NOT LIKE :{$p}")
                       ->setParameter($p, '%' . $this->escapeLike(strtolower((string) $value)) . '%');
                    break;
                case 'begins_with':
                    $qb->andWhere("LOWER(p.{$prop}) LIKE :{$p}")
                       ->setParameter($p, $this->escapeLike(strtolower((string) $value)) . '%');
                    break;
                case 'ends_with':
                    $qb->andWhere("LOWER(p.{$prop}) LIKE :{$p}")
                       ->setParameter($p, '%' . $this->escapeLike(strtolower((string) $value)));
                    break;
                // Numeric conditions
                case 'eq':  $qb->andWhere("p.{$prop} = :{$p}")->setParameter($p, $value);  break;
                case 'neq': $qb->andWhere("p.{$prop} != :{$p}")->setParameter($p, $value); break;
                case 'gt':  $qb->andWhere("p.{$prop} > :{$p}")->setParameter($p, $value);  break;
                case 'gte': $qb->andWhere("p.{$prop} >= :{$p}")->setParameter($p, $value); break;
                case 'lt':  $qb->andWhere("p.{$prop} < :{$p}")->setParameter($p, $value);  break;
                case 'lte': $qb->andWhere("p.{$prop} <= :{$p}")->setParameter($p, $value); break;
                case 'between':
                    $qb->andWhere("p.{$prop} BETWEEN :{$p} AND :{$p2}")
                       ->setParameter($p, $value)
                       ->setParameter($p2, $value2);
                    break;
                case 'not_between':
                    // DQL has no NOT BETWEEN — express as two comparisons.
                    $qb->andWhere("p.{$prop} < :{$p} OR p.{$prop} > :{$p2}")
                       ->setParameter($p, $value)
                       ->setParameter($p2, $value2);
                    break;
                case 'empty':
                    $isString = in_array($prop, ['name', 'sku', 'category'], true);
                    $qb->andWhere($isString
                        ? "p.{$prop} IS NULL OR p.{$prop} = ''"
                        : "p.{$prop} IS NULL");
                    break;
                case 'not_empty':
                    $isString = in_array($prop, ['name', 'sku', 'category'], true);
                    $qb->andWhere($isString
                        ? "p.{$prop} IS NOT NULL AND p.{$prop} != ''"
                        : "p.{$prop} IS NOT NULL");
                    break;
            }
        }

        return $qb;
    }

    // Escape LIKE metacharacters so literal % and _ in user input don't act as
    // wildcards. MySQL's default escape char is \, so we prefix \, %, and _ with \.
    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
