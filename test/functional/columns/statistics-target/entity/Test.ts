import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class Test {

    @PrimaryGeneratedColumn()
    id: number;

    // Default cluster target (no override).
    @Column()
    a: string;

    // Explicit override.
    @Column({ statisticsTarget: 1000 })
    b: string;

    // Larger override for a hot predicate column.
    @Column({ statisticsTarget: 5000 })
    c: string;
}
