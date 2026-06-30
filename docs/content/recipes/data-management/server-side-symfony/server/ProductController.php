<?php

namespace App\Controller;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

// Routes are declared as PHP attributes directly on the controller.
// All four HTTP verbs share the base /api/products path.
#[Route('/api/products')]
class ProductController extends AbstractController
{
    public function __construct(private readonly ProductRepository $products) {}

    // GET /api/products
    // Query string — what Handsontable sends via buildUrl():
    //   page, pageSize, sort[prop], sort[order],
    //   filters[0][prop], filters[0][condition], filters[0][value], filters[0][value2]
    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = max(1, (int) $request->query->get('pageSize', 10));
        $sort     = $request->query->all('sort');     // ['prop' => ..., 'order' => ...]
        $filters  = $request->query->all('filters');  // array of filter objects

        ['products' => $products, 'total' => $total] =
            $this->products->findPage($page, $pageSize, $sort, $filters);

        // Map entities to plain arrays. Cast price to float so Handsontable's
        // numeric cell type receives 1299.99 instead of the Doctrine string "1299.99".
        $data = array_map(fn(Product $p) => [
            'id'         => $p->getId(),
            'name'       => $p->getName(),
            'sku'        => $p->getSku(),
            'category'   => $p->getCategory(),
            'price'      => (float) $p->getPrice(),
            'stock'      => $p->getStock(),
            'sort_order' => $p->getSortOrder(),
        ], $products);

        // Return the shape that fetchRows expects: { data: [...], total: n }
        return $this->json(['data' => $data, 'total' => $total]);
    }

    // POST /api/products
    // Body (JSON): { position, referenceRowId, rowsAmount }
    // Matches the onRowsCreate payload shape.
    #[Route('', methods: ['POST'])]
    public function store(Request $request): JsonResponse
    {
        $payload        = json_decode($request->getContent(), true) ?? [];
        $rowsAmount     = max(1, (int) ($payload['rowsAmount'] ?? 1));
        $position       = $payload['position'] ?? 'below';
        $referenceRowId = isset($payload['referenceRowId']) ? (int) $payload['referenceRowId'] : null;

        $created = $this->products->createBlankRows($rowsAmount, $position, $referenceRowId);

        $data = array_map(fn(Product $p) => [
            'id'         => $p->getId(),
            'name'       => $p->getName(),
            'sku'        => $p->getSku(),
            'category'   => $p->getCategory(),
            'price'      => (float) $p->getPrice(),
            'stock'      => $p->getStock(),
            'sort_order' => $p->getSortOrder(),
        ], $created);

        return $this->json($data, 201);
    }

    // PATCH /api/products
    // Body (JSON): [{ id, changes: { name?, price?, ... }, rowData? }, ...]
    // Matches the onRowsUpdate payload shape.
    #[Route('', methods: ['PATCH'])]
    public function batchUpdate(Request $request): JsonResponse
    {
        $rows = json_decode($request->getContent(), true) ?? [];

        $this->products->updateRows($rows);

        return $this->json(null, 200);
    }

    // DELETE /api/products
    // Body (JSON): [1, 4, 7]  — array of product IDs
    // Matches the onRowsRemove payload shape.
    #[Route('', methods: ['DELETE'])]
    public function batchDestroy(Request $request): JsonResponse
    {
        $ids = json_decode($request->getContent(), true) ?? [];

        $this->products->deleteByIds($ids);

        return $this->json(null, 204);
    }
}
