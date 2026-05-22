<?php

namespace App\Entity;

use App\Repository\ProductRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProductRepository::class)]
#[ORM\Table(name: 'products')]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name = '';

    // SKU is generated server-side, so it is read-only in the grid.
    #[ORM\Column(length: 255, unique: true)]
    private string $sku = '';

    #[ORM\Column(length: 255)]
    private string $category = '';

    // Stored as decimal string by Doctrine; cast to float in the controller response.
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $price = '0.00';

    #[ORM\Column]
    private int $stock = 0;

    // Tracks display order independently of the primary key so that
    // row insertions at arbitrary positions work correctly.
    #[ORM\Column(options: ['unsigned' => true, 'default' => 0])]
    private int $sortOrder = 0;

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getSku(): string { return $this->sku; }
    public function setSku(string $sku): self { $this->sku = $sku; return $this; }

    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): self { $this->category = $category; return $this; }

    public function getPrice(): string { return $this->price; }
    public function setPrice(mixed $price): self { $this->price = (string) $price; return $this; }

    public function getStock(): int { return $this->stock; }
    public function setStock(mixed $stock): self { $this->stock = (int) $stock; return $this; }

    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): self { $this->sortOrder = $sortOrder; return $this; }
}
