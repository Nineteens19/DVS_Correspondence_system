using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("OUT_ITEM")]
public class OutItem
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocNo")]
    [StringLength(100)]
    public string DocNo { get; set; } = string.Empty;

    [Column("Description")]
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Column("RecipientName")]
    [StringLength(200)]
    public string? RecipientName { get; set; }

    [Column("Note")]
    [StringLength(1000)]
    public string? Note { get; set; }

    // Navigation
    [ForeignKey(nameof(DocNo))]
    public virtual OutDoc? OutDoc { get; set; }
}

[Table("OUT_RECIPIENT")]
public class OutRecipient
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocNo")]
    [StringLength(100)]
    public string DocNo { get; set; } = string.Empty;

    [Column("Name")]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("Position")]
    [StringLength(200)]
    public string? Position { get; set; }

    [Column("Department")]
    [StringLength(200)]
    public string? Department { get; set; }

    // Navigation
    [ForeignKey(nameof(DocNo))]
    public virtual OutDoc? OutDoc { get; set; }
}

[Table("OUT_SIGNER")]
public class OutSigner
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocNo")]
    [StringLength(100)]
    public string DocNo { get; set; } = string.Empty;

    [Column("Name")]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("Position")]
    [StringLength(200)]
    public string? Position { get; set; }

    // Navigation
    [ForeignKey(nameof(DocNo))]
    public virtual OutDoc? OutDoc { get; set; }
}
